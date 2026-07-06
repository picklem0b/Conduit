import { getRedis } from "./redis.client";

const PREFIX = "conduit:rl:";

function rlKey(identifier: string, action: string): string {
   return `${PREFIX}${action}:${identifier}`;
}

export interface RateLimitResult {
   allowed: boolean;
   remaining: number;
   resetAt: number;
   retryAfterMs: number;
}

/**
 * Sliding window rate limiter using Redis sorted sets. Each request adds a
 * member with score = timestamp. Old entries outside the window are pruned
 * on every check — no background cleanup job needed.
 *
 * @param identifier - Unique identifier for the caller (IP, user ID, API key hash)
 * @param action     - Action being rate-limited (e.g. 'chat.stream', 'keys.save')
 * @param limit      - Max requests allowed in the window
 * @param windowMs   - Window size in milliseconds
 */
export async function checkRateLimit(
   identifier: string,
   action: string,
   limit: number,
   windowMs: number
): Promise<RateLimitResult> {
   const r = getRedis();
   const key = rlKey(identifier, action);
   const now = Date.now();
   const windowStart = now - windowMs;
   const resetAt = now + windowMs;

   // Atomic sliding window via pipeline
   const pipeline = r.pipeline();
   pipeline.zremrangebyscore(key, "-inf", windowStart); // remove expired entries
   pipeline.zadd(key, now, `${now}-${Math.random()}`); // add current request
   pipeline.zcard(key); // count in window
   pipeline.expire(key, Math.ceil(windowMs / 1_000)); // TTL for cleanup

   const results = await pipeline.exec();
   const count = (results?.[2]?.[1] as number) ?? 0;

   const allowed = count <= limit;
   const remaining = Math.max(0, limit - count);

   if (!allowed) {
      // Find the oldest entry to compute retry-after
      const oldest = await r.zrange(key, 0, 0, "WITHSCORES");
      const oldestTs = oldest[1] ? parseInt(oldest[1], 10) : now;
      const retryAfterMs = oldestTs + windowMs - now;

      return {
         allowed: false,
         remaining: 0,
         resetAt,
         retryAfterMs: Math.max(0, retryAfterMs)
      };
   }

   return { allowed: true, remaining, resetAt, retryAfterMs: 0 };
}

/**
 * Resets the rate limit for a given identifier and action.
 * Used in tests and admin endpoints.
 */
export async function resetRateLimit(
   identifier: string,
   action: string
): Promise<void> {
   await getRedis().del(rlKey(identifier, action));
}
