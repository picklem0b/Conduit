import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { transaction, getPool } from "./postgres.client";

const MIGRATIONS_DIR = join(
   dirname(fileURLToPath(import.meta.url)),
   "migrations"
);
const TRACKING_TABLE = "schema_migrations";

interface MigrationFile {
   filename: string;
   sql: string;
}

/**
 * Ensures the migration tracking table exists. Idempotent — safe to call
 * on every startup.
 */
async function ensureTrackingTable(): Promise<void> {
   await getPool().query(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      filename   TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      checksum   TEXT        NOT NULL
    )
  `);
}

/**
 * Returns a simple FNV-1a checksum of the SQL string. Used to detect if a
 * previously applied migration file has been modified — which is a hard error
 * in production (migrations are immutable once applied).
 */
function checksum(sql: string): string {
   let hash = 2_166_136_261;
   for (let i = 0; i < sql.length; i++) {
      hash ^= sql.charCodeAt(i);
      hash = (hash * 16_777_619) >>> 0;
   }
   return hash.toString(16);
}

function loadMigrationFiles(): MigrationFile[] {
   return readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .sort()
      .map(filename => ({
         filename,
         sql: readFileSync(join(MIGRATIONS_DIR, filename), "utf-8")
      }));
}

/**
 * Runs pending migrations in order. Each migration runs inside its own
 * transaction — a failed migration rolls back cleanly and the process exits
 * with a non-zero code so the deployment is halted.
 *
 * Previously applied migrations are verified by checksum. A mismatch means
 * someone modified an already-applied file, which is always a mistake.
 */
export async function runMigrations(): Promise<void> {
   await ensureTrackingTable();

   const applied = new Map(
      (
         await getPool().query<{ filename: string; checksum: string }>(
            `SELECT filename, checksum FROM ${TRACKING_TABLE}`
         )
      ).rows.map(r => [r.filename, r.checksum])
   );

   const files = loadMigrationFiles();

   for (const { filename, sql } of files) {
      const fileChecksum = checksum(sql);

      if (applied.has(filename)) {
         const storedChecksum = applied.get(filename)!;
         if (storedChecksum !== fileChecksum) {
            throw new Error(
               `[migrate] Checksum mismatch for ${filename}.\n` +
                  `Migration files are immutable once applied.\n` +
                  `Expected: ${storedChecksum}\n` +
                  `Got:      ${fileChecksum}\n\n` +
                  `If this is intentional, create a new migration file instead of modifying the existing one.`
            );
         }
         console.log(`[migrate] skip  ${filename} (already applied)`);
         continue;
      }

      console.log(`[migrate] apply ${filename}...`);

      await transaction(async client => {
         await client.query(sql);
         await client.query(
            `INSERT INTO ${TRACKING_TABLE} (filename, checksum) VALUES ($1, $2)`,
            [filename, fileChecksum]
         );
      });

      console.log(`[migrate] done  ${filename}`);
   }

   console.log("[migrate] all migrations up to date");
}
