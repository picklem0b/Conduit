import { getRedis } from "./redis.client";

const CACHE_PREFIX = "conduit:cache:";

function cacheKey(namespace: string, key: string): string {
   return `${CACHE_PREFIX}${namespace}:${key}`;
}

/**
 * Generic get/set cache backed by Redis strings with JSON serialization.
 * Used for short-lived data that's expensive to recompute — provider health
 * probes, site config lookups, OpenAPI spec generation, etc.
 */
export async function cacheGet<T>(
   namespace: string,
   key: string
): Promise<T | null> {
   const raw = await getRedis().get(cacheKey(namespace, key));
   if (raw === null) return null;

   try {
      return JSON.parse(raw) as T;
   } catch {
      return null;
   }
}

export async function cacheSet<T>(
   namespace: string,
   key: string,
   value: T,
   ttlSeconds: number
): Promise<void> {
   await getRedis().setex(
      cacheKey(namespace, key),
      ttlSeconds,
      JSON.stringify(value)
   );
}

export async function cacheDelete(
   namespace: string,
   key: string
): Promise<void> {
   await getRedis().del(cacheKey(namespace, key));
}

export async function cacheDeleteNamespace(namespace: string): Promise<void> {
   const pattern = `${CACHE_PREFIX}${namespace}:*`;
   const keys = await getRedis().keys(pattern);
   if (keys.length > 0) {
      await getRedis().del(...keys);
   }
}

/**
 * Cache-aside helper. Returns the cached value if present, otherwise calls
 * `fn`, caches the result, and returns it.
 *
 * Example:
 * ```ts
 * const health = await withCache('provider', 'anthropic', 30, () => probe())
 * ```
 */
export async function withCache<T>(
   namespace: string,
   key: string,
   ttlSeconds: number,
   fn: () => Promise<T>
): Promise<T> {
   const cached = await cacheGet<T>(namespace, key);
   if (cached !== null) return cached;

   const value = await fn();
   await cacheSet(namespace, key, value, ttlSeconds);
   return value;
}
