import {
   Pool,
   type PoolClient,
   type QueryResult,
   type QueryResultRow
} from "pg";

// ── Singleton pool ─────────────────────────────────────────────────────────────

let _pool: Pool | null = null;

/**
 * Initializes the Postgres connection pool. Must be called once at startup
 * before any store or migration is used.
 *
 * Pool sizing rationale:
 * - max 20: safe default for a single gateway instance on shared hosting
 * - idleTimeoutMillis 30s: release idle connections before the server-side
 *   idle timeout (Postgres default is 10 minutes — we stay well under it)
 * - connectionTimeoutMillis 5s: fail fast rather than hanging forever on
 *   misconfigured credentials
 */
export function initPostgres(connectionString: string): Pool {
   if (_pool) {
      console.warn(
         "[db:postgres] initPostgres called more than once — returning existing pool"
      );
      return _pool;
   }

   _pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: false
   });

   _pool.on("error", err => {
      console.error("[db:postgres] unexpected pool error:", err.message);
   });

   return _pool;
}

/**
 * Returns the active pool. Throws if `initPostgres` hasn't been called —
 * this is a programming error, not a runtime one, so a hard throw is correct.
 */
export function getPool(): Pool {
   if (!_pool) {
      throw new Error(
         "[db:postgres] Pool not initialized. Call initPostgres() at startup before using any store."
      );
   }
   return _pool;
}

// ── Query helpers ─────────────────────────────────────────────────────────────

/**
 * Executes a parameterized query against the pool.
 * Use this for one-shot queries that don't need a transaction.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
   sql: string,
   params?: unknown[]
): Promise<QueryResult<T>> {
   return getPool().query<T>(sql, params);
}

/**
 * Runs a callback inside a serializable transaction, automatically committing
 * on success or rolling back on any thrown error.
 *
 * Example:
 * ```ts
 * const result = await transaction(async (client) => {
 *   await client.query('INSERT INTO ...')
 *   await client.query('UPDATE ...')
 *   return 'done'
 * })
 * ```
 */
export async function transaction<T>(
   callback: (client: PoolClient) => Promise<T>
): Promise<T> {
   const client = await getPool().connect();
   try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
   } catch (err) {
      await client.query("ROLLBACK");
      throw err;
   } finally {
      client.release();
   }
}

// ── Health check ──────────────────────────────────────────────────────────────

export interface PostgresHealth {
   healthy: boolean;
   latencyMs: number;
   totalConnections: number;
   idleConnections: number;
   waitingClients: number;
   error?: string;
}

export async function checkPostgresHealth(): Promise<PostgresHealth> {
   const pool = getPool();
   const started = Date.now();

   try {
      await pool.query("SELECT 1");
      return {
         healthy: true,
         latencyMs: Date.now() - started,
         totalConnections: pool.totalCount,
         idleConnections: pool.idleCount,
         waitingClients: pool.waitingCount
      };
   } catch (err) {
      return {
         healthy: false,
         latencyMs: Date.now() - started,
         totalConnections: pool.totalCount,
         idleConnections: pool.idleCount,
         waitingClients: pool.waitingCount,
         error: err instanceof Error ? err.message : String(err)
      };
   }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

/**
 * Drains and closes the pool. Call this in your SIGTERM/SIGINT handler to
 * ensure in-flight queries complete before the process exits.
 */
export async function closePostgres(): Promise<void> {
   if (!_pool) return;
   await _pool.end();
   _pool = null;
}
