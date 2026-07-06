import Redis from "ioredis";

// ── Singleton client ──────────────────────────────────────────────────────────

let _client: Redis | null = null;

/**
 * Initializes the Redis client. Must be called once at startup.
 *
 * Uses ioredis with auto-reconnect and a connection timeout. The client
 * is not lazy — it connects immediately so startup fails fast if Redis
 * is unavailable, rather than silently degrading on the first request.
 */
export function initRedis(url: string): Redis {
   if (_client) {
      console.warn(
         "[db:redis] initRedis called more than once — returning existing client"
      );
      return _client;
   }

   _client = new Redis(url, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5_000,
      lazyConnect: false,
      retryStrategy: times => {
         if (times > 10) return null; // stop retrying after 10 attempts
         return Math.min(times * 200, 2_000);
      }
   });

   _client.on("error", err => {
      console.error("[db:redis] client error:", err.message);
   });

   _client.on("reconnecting", () => {
      console.warn("[db:redis] reconnecting...");
   });

   return _client;
}

export function getRedis(): Redis {
   if (!_client) {
      throw new Error(
         "[db:redis] Client not initialized. Call initRedis() at startup before using any cache or store."
      );
   }
   return _client;
}

// ── Health check ──────────────────────────────────────────────────────────────

export interface RedisHealth {
   healthy: boolean;
   latencyMs: number;
   error?: string;
}

export async function checkRedisHealth(): Promise<RedisHealth> {
   const started = Date.now();
   try {
      await getRedis().ping();
      return { healthy: true, latencyMs: Date.now() - started };
   } catch (err) {
      return {
         healthy: false,
         latencyMs: Date.now() - started,
         error: err instanceof Error ? err.message : String(err)
      };
   }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

export async function closeRedis(): Promise<void> {
   if (!_client) return;
   await _client.quit();
   _client = null;
}
