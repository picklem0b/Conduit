/**
 * SQLite fallback client for Conduit.
 *
 * Activated when `data.sqlite_fallback = true` in conduit.config.toml.
 * Intended for single-instance deployments where running a full Postgres
 * server is impractical (local dev without Docker, Termux, low-resource VMs).
 *
 * API surface mirrors postgres.client.ts exactly so callers are unaware of
 * which backend is active. The only consumer that touches the backend
 * directly is index.ts — everywhere else goes through the stores.
 *
 * Implementation uses Bun's built-in SQLite driver (bun:sqlite) which is
 * a synchronous, zero-dependency, high-performance binding to SQLite3.
 * Bun's driver does not support async queries — all operations are
 * synchronous under the hood, but we expose an async API to match Postgres
 * so higher layers never need to branch on backend type.
 *
 * Limitations vs Postgres:
 * - No connection pool — SQLite is single-writer, pool concept doesn't apply.
 * - No LISTEN/NOTIFY — not needed by Conduit's current architecture.
 * - NUMERIC columns come back as strings in Postgres; SQLite returns them as
 *   JS numbers. Callers already handle both (parseFloat is idempotent on numbers).
 * - gen_random_bytes() PostgreSQL function is emulated in migrations via
 *   a SQLite-compatible random hex generation approach.
 * - pgcrypto extension is skipped — SQLite migrations are loaded separately
 *   from the Postgres ones.
 *
 * SQLite migrations live in db/sqlite/migrations/ and are functionally
 * equivalent to the Postgres ones with syntax adapted for SQLite
 * (no TIMESTAMPTZ → TEXT ISO8601, no gen_random_bytes → hex(randomblob(N)),
 *  no CREATE EXTENSION, no BIGSERIAL → INTEGER PRIMARY KEY AUTOINCREMENT).
 */

import { Database, type Statement } from "bun:sqlite";
import { readdirSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Singleton ──────────────────────────────────────────────────────────────────

let _db: Database | null = null;

// ── Query result types (match pg's QueryResult shape) ─────────────────────────

export interface SQLiteQueryResult<T> {
   rows: T[];
   rowCount: number;
}

// ── Init ───────────────────────────────────────────────────────────────────────

/**
 * Opens (or creates) the SQLite database file. Must be called once at startup.
 *
 * The database file path is resolved from the DATA_DIR env var, then
 * ./data/conduit.db relative to the process CWD. The parent directory is
 * created if it doesn't exist.
 *
 * WAL mode is enabled immediately after open. This is the most important
 * pragma for Conduit's workload:
 * - Readers never block writers
 * - Writers never block readers
 * - Concurrent reads from multiple async Bun tasks (even though SQLite itself
 *   is synchronous, Bun runs JS off the main thread via workers)
 *
 * foreign_keys must be enabled per-connection in SQLite — it's off by default.
 */
export function initSQLite(dbPath?: string): Database {
   if (_db) {
      console.warn(
         "[db:sqlite] initSQLite called more than once — returning existing db"
      );
      return _db;
   }

   const resolvedPath =
      dbPath ??
      process.env.SQLITE_PATH ??
      join(process.cwd(), "data", "conduit.db");

   // Ensure parent directory exists
   const dir = dirname(resolvedPath);
   if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
   }

   _db = new Database(resolvedPath, {
      // create: true is the default, but explicit is clear
      create: true,
      // strict: true enforces column type affinity strictly — matches Postgres behavior
      strict: false // Bun's strict mode is too aggressive for our migration SQL
   });

   // Essential pragmas — applied synchronously before any other operation
   _db.run("PRAGMA journal_mode = WAL");
   _db.run("PRAGMA foreign_keys = ON");
   _db.run("PRAGMA synchronous = NORMAL"); // WAL + NORMAL = safe and fast
   _db.run("PRAGMA cache_size = -64000"); // 64MB page cache
   _db.run("PRAGMA temp_store = MEMORY");
   _db.run("PRAGMA mmap_size = 268435456"); // 256MB memory-mapped I/O

   console.log(`[db:sqlite] Opened database at ${resolvedPath}`);
   return _db;
}

/**
 * Returns the active database. Throws if initSQLite hasn't been called.
 */
export function getSQLiteDB(): Database {
   if (!_db) {
      throw new Error(
         "[db:sqlite] Database not initialized. Call initSQLite() at startup."
      );
   }
   return _db;
}

// ── Query helpers (async wrappers around synchronous Bun SQLite) ──────────────

/**
 * Executes a parameterized SELECT query and returns all rows.
 *
 * Parameter substitution: SQLite uses $name or ? placeholders.
 * We accept Postgres-style $1, $2, ... and rewrite them to ? before
 * preparing the statement, since all existing stores use $N syntax.
 *
 * Statements are not cached here — Bun's Database.prepare() is fast enough
 * that per-call prepare is acceptable for a self-hosted single-instance app.
 * If profiling shows this is a bottleneck, add a Map<string, Statement> cache.
 */
export async function sqliteQuery<T = Record<string, unknown>>(
   sql: string,
   params: unknown[] = []
): Promise<SQLiteQueryResult<T>> {
   const db = getSQLiteDB();
   const normalized = normalizePlaceholders(sql);

   try {
      const stmt = db.prepare(normalized);
      const rows = stmt.all(...params) as T[];
      return { rows, rowCount: rows.length };
   } catch (err) {
      throw wrapSQLiteError(err, sql);
   }
}

/**
 * Executes a DML statement (INSERT, UPDATE, DELETE) and returns the number
 * of affected rows. For INSERT ... RETURNING, use sqliteQuery() instead.
 *
 * Note: Bun's stmt.run() returns a `{ lastInsertRowid, changes }` object.
 * We return changes to match pg's QueryResult.rowCount semantics.
 */
export async function sqliteRun(
   sql: string,
   params: unknown[] = []
): Promise<number> {
   const db = getSQLiteDB();
   const normalized = normalizePlaceholders(sql);

   try {
      const stmt = db.prepare(normalized);
      const result = stmt.run(...params);
      return result.changes;
   } catch (err) {
      throw wrapSQLiteError(err, sql);
   }
}

/**
 * Runs a callback inside a SQLite transaction (BEGIN IMMEDIATE ... COMMIT).
 * Uses BEGIN IMMEDIATE rather than BEGIN DEFERRED to acquire a write lock
 * upfront, preventing "database is locked" SQLITE_BUSY errors when the
 * callback performs multiple writes.
 *
 * Mirrors the postgres.client.ts `transaction()` signature exactly.
 */
export async function sqliteTransaction<T>(
   callback: (db: Database) => Promise<T>
): Promise<T> {
   const db = getSQLiteDB();

   // Bun's Database.transaction() wraps synchronous callbacks. Because our
   // store code is async (for Postgres compatibility), we cannot use it
   // directly. Instead we manually manage the transaction with raw PRAGMA
   // calls and run the async callback between BEGIN and COMMIT.
   //
   // This is safe because Bun's event loop is single-threaded — no other
   // async task can interleave between awaits within the same microtask queue
   // drain, meaning no other query can sneak in between our BEGIN and COMMIT.
   db.run("BEGIN IMMEDIATE");
   try {
      const result = await callback(db);
      db.run("COMMIT");
      return result;
   } catch (err) {
      try {
         db.run("ROLLBACK");
      } catch {
         // If ROLLBACK itself fails (e.g. connection closed), ignore it
      }
      throw err;
   }
}

// ── Health check ───────────────────────────────────────────────────────────────

export interface SQLiteHealth {
   healthy: boolean;
   latencyMs: number;
   path: string;
   walMode: boolean;
   error?: string;
}

export async function checkSQLiteHealth(): Promise<SQLiteHealth> {
   const started = Date.now();
   try {
      const db = getSQLiteDB();
      db.prepare("SELECT 1").get();
      const walRow = db.prepare("PRAGMA journal_mode").get() as
         | {
              journal_mode: string;
           }
         | undefined;
      return {
         healthy: true,
         latencyMs: Date.now() - started,
         path: (db as unknown as { filename: string }).filename ?? "unknown",
         walMode: walRow?.journal_mode === "wal"
      };
   } catch (err) {
      return {
         healthy: false,
         latencyMs: Date.now() - started,
         path: "unknown",
         walMode: false,
         error: err instanceof Error ? err.message : String(err)
      };
   }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

/**
 * Checkpoints the WAL file and closes the database.
 * Call this in SIGTERM/SIGINT handlers to ensure the WAL is fully
 * flushed to the main database file before the process exits.
 * Without this, the next open may need to replay the WAL, which is
 * safe but slower.
 */
export async function closeSQLite(): Promise<void> {
   if (!_db) return;
   try {
      // TRUNCATE checkpoint: flush all WAL pages to the main file and reset WAL
      _db.run("PRAGMA wal_checkpoint(TRUNCATE)");
   } catch {
      // Best-effort — don't throw during shutdown
   }
   _db.close();
   _db = null;
}

// ── Migrations ────────────────────────────────────────────────────────────────

const MIGRATIONS_DIR = join(
   dirname(fileURLToPath(import.meta.url)),
   "migrations"
);
const TRACKING_TABLE = "schema_migrations";

/**
 * FNV-1a 32-bit checksum — identical algorithm to postgres.migrate.ts so
 * checksums match if someone copies SQL files between the two directories.
 */
function checksum(sql: string): string {
   let hash = 2_166_136_261;
   for (let i = 0; i < sql.length; i++) {
      hash ^= sql.charCodeAt(i);
      hash = (hash * 16_777_619) >>> 0;
   }
   return hash.toString(16);
}

/**
 * Runs SQLite-specific migrations from db/sqlite/migrations/.
 * Logic mirrors postgres.migrate.ts: idempotent, checksum-verified,
 * each migration in its own transaction.
 */
export async function runSQLiteMigrations(): Promise<void> {
   const db = getSQLiteDB();

   // Ensure tracking table exists
   db.run(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      filename   TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now')),
      checksum   TEXT NOT NULL
    )
  `);

   const applied = new Map<string, string>(
      (
         db
            .prepare(`SELECT filename, checksum FROM ${TRACKING_TABLE}`)
            .all() as Array<{ filename: string; checksum: string }>
      ).map(r => [r.filename, r.checksum])
   );

   const files = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .sort()
      .map(filename => ({
         filename,
         sql: readFileSync(join(MIGRATIONS_DIR, filename), "utf-8")
      }));

   for (const { filename, sql } of files) {
      const fileChecksum = checksum(sql);

      if (applied.has(filename)) {
         const storedChecksum = applied.get(filename)!;
         if (storedChecksum !== fileChecksum) {
            throw new Error(
               `[sqlite:migrate] Checksum mismatch for ${filename}.\n` +
                  `Migration files are immutable once applied.\n` +
                  `Expected: ${storedChecksum}\n` +
                  `Got:      ${fileChecksum}\n\n` +
                  `Create a new migration file instead of modifying an existing one.`
            );
         }
         console.log(`[sqlite:migrate] skip  ${filename} (already applied)`);
         continue;
      }

      console.log(`[sqlite:migrate] apply ${filename}...`);

      db.run("BEGIN IMMEDIATE");
      try {
         // SQLite doesn't support multiple statements in one prepare() call.
         // Split on semicolons and run each statement individually.
         const statements = sql
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith("--"));

         for (const stmt of statements) {
            db.run(stmt);
         }

         db.prepare(
            `INSERT INTO ${TRACKING_TABLE} (filename, checksum) VALUES (?, ?)`
         ).run(filename, fileChecksum);

         db.run("COMMIT");
      } catch (err) {
         db.run("ROLLBACK");
         throw new Error(
            `[sqlite:migrate] Failed to apply ${filename}: ${
               err instanceof Error ? err.message : String(err)
            }`
         );
      }

      console.log(`[sqlite:migrate] done  ${filename}`);
   }

   console.log("[sqlite:migrate] all migrations up to date");
}

// ── Postgres placeholder compatibility ────────────────────────────────────────

/**
 * Rewrites Postgres-style positional parameters ($1, $2, ...) to SQLite's
 * positional ? placeholders.
 *
 * Also rewrites a small set of Postgres-specific SQL patterns that appear
 * in the stores so they work transparently on SQLite:
 *
 * - `gen_random_bytes(N)` → `randomblob(N)` + `encode(..., 'hex')` → `hex(...)`
 * - `now()` → `datetime('now')`
 * - `RETURNING *` and `RETURNING col1, col2` — supported natively by SQLite 3.35+
 *   (Bun bundles SQLite 3.43+, so this is safe)
 * - `ON CONFLICT (col) DO UPDATE SET` — supported by SQLite 3.24+ (upsert)
 * - `TIMESTAMPTZ` → `TEXT` — handled at migration level, not query level
 *
 * This is intentionally a best-effort rewriter for the known patterns in
 * Conduit's stores. It is NOT a general Postgres→SQLite SQL transpiler.
 * If a new store adds Postgres-specific syntax not covered here, add it.
 */
function normalizePlaceholders(sql: string): string {
   return (
      sql
         // $1, $2, ... → ?
         .replace(/\$(\d+)/g, "?")
         // now() → datetime('now')
         .replace(/\bnow\(\)/gi, "datetime('now')")
         // encode(gen_random_bytes(N), 'hex') → lower(hex(randomblob(N)))
         .replace(
            /encode\(gen_random_bytes\((\d+)\),\s*'hex'\)/gi,
            "lower(hex(randomblob($1)))"
         )
         // LIMIT $1 → LIMIT ? (already handled above, but explicit for clarity)
         // ILIKE → LIKE (SQLite has no ILIKE; text is case-sensitive by default
         //               but LIKE is case-insensitive for ASCII in SQLite)
         .replace(/\bILIKE\b/gi, "LIKE")
   );
}

// ── Error wrapping ─────────────────────────────────────────────────────────────

/**
 * Wraps a raw SQLite error with context about which SQL statement failed.
 * Mimics pg's error shape enough that generic catch blocks work the same way.
 */
function wrapSQLiteError(err: unknown, sql: string): Error {
   const base = err instanceof Error ? err : new Error(String(err));
   const preview = sql.slice(0, 120).replace(/\s+/g, " ");
   base.message = `[sqlite] ${base.message}\nSQL: ${preview}`;
   return base;
}
