import { getRedis } from "./redis.client";

// ── Key conventions ───────────────────────────────────────────────────────────
// All keys are namespaced under conduit: to avoid collisions with other apps
// sharing the same Redis instance.

const KEY_PREFIX = "conduit:usage:";
const HEALTH_PREFIX = "conduit:health:";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days — engine aggregator reads before expiry

function usageKey(provider: string): string {
   return `${KEY_PREFIX}${provider}`;
}

function healthKey(provider: string): string {
   return `${HEALTH_PREFIX}${provider}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UsageStat {
   provider: string;
   requestCount: number;
   errorCount: number;
   rateLimitHits: number;
   totalLatencyMs: number;
   totalTokens: number;
   totalCostUsd: number;
   lastUsedAt: number | null;
   lastError: string | null;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function recordSuccess(
   provider: string,
   latencyMs: number,
   tokens = 0,
   costUsd = 0
): Promise<void> {
   const r = getRedis();
   const k = usageKey(provider);

   await r
      .pipeline()
      .hincrby(k, "requestCount", 1)
      .hincrby(k, "totalLatencyMs", latencyMs)
      .hincrby(k, "totalTokens", tokens)
      .hincrbyfloat(k, "totalCostUsd", costUsd)
      .hset(k, "lastUsedAt", Date.now())
      .expire(k, TTL_SECONDS)
      .exec();
}

export async function recordError(
   provider: string,
   kind: "rate_limited" | "error",
   message: string
): Promise<void> {
   const r = getRedis();
   const k = usageKey(provider);

   const pipeline = r
      .pipeline()
      .hincrby(k, "requestCount", 1)
      .hincrby(k, "errorCount", 1)
      .hset(k, "lastUsedAt", Date.now())
      .hset(k, "lastError", message.slice(0, 500)) // cap error message length
      .expire(k, TTL_SECONDS);

   if (kind === "rate_limited") {
      pipeline.hincrby(k, "rateLimitHits", 1);
   }

   await pipeline.exec();
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getUsageStat(provider: string): Promise<UsageStat> {
   const data = await getRedis().hgetall(usageKey(provider));

   return {
      provider,
      requestCount: parseInt(data["requestCount"] ?? "0", 10),
      errorCount: parseInt(data["errorCount"] ?? "0", 10),
      rateLimitHits: parseInt(data["rateLimitHits"] ?? "0", 10),
      totalLatencyMs: parseInt(data["totalLatencyMs"] ?? "0", 10),
      totalTokens: parseInt(data["totalTokens"] ?? "0", 10),
      totalCostUsd: parseFloat(data["totalCostUsd"] ?? "0"),
      lastUsedAt: data["lastUsedAt"] ? parseInt(data["lastUsedAt"], 10) : null,
      lastError: data["lastError"] ?? null
   };
}

export async function getAllUsageStats(
   providers: string[]
): Promise<UsageStat[]> {
   return Promise.all(providers.map(getUsageStat));
}

// ── Health scoring ────────────────────────────────────────────────────────────

/**
 * Computes a health score in [0, 1] for a provider based on its recent usage
 * statistics. 1.0 = perfectly healthy, 0.0 = completely broken.
 *
 * Weighting:
 * - Error rate:       50% — the strongest signal that something is wrong
 * - Rate limit rate:  35% — predictive signal (imminent degradation)
 * - Latency penalty:  15% — relative penalty, capped at 10s avg
 *
 * Providers with no recorded requests default to 0.75 — neutral, not penalized
 * for being new, but not assumed healthy either.
 *
 * The computed score is cached in Redis for 2 minutes so the cascade engine
 * reads a fast in-memory value rather than recomputing on every request. The
 * engine's health aggregator recalculates and refreshes this cache on a fixed
 * schedule.
 */
export async function getHealthScore(provider: string): Promise<number> {
   // Try cache first
   const cached = await getRedis().get(healthKey(provider));
   if (cached !== null) return parseFloat(cached);

   // Compute from raw stats
   const stat = await getUsageStat(provider);
   const score = computeHealthScore(stat);

   // Cache for 2 minutes
   await getRedis().setex(healthKey(provider), 120, score.toString());

   return score;
}

export function computeHealthScore(stat: UsageStat): number {
   if (stat.requestCount === 0) return 0.75;

   const errorRate = stat.errorCount / stat.requestCount;
   const rateLimitRate = stat.rateLimitHits / stat.requestCount;
   const avgLatency = stat.totalLatencyMs / stat.requestCount;
   const latencyPenalty = Math.min(avgLatency / 10_000, 1);

   const raw =
      1 - errorRate * 0.5 - rateLimitRate * 0.35 - latencyPenalty * 0.15;
   return Math.max(0, Math.min(1, raw));
}

export async function setHealthScore(
   provider: string,
   score: number
): Promise<void> {
   await getRedis().setex(healthKey(provider), 120, score.toFixed(6));
}

export async function invalidateHealthScore(provider: string): Promise<void> {
   await getRedis().del(healthKey(provider));
}
