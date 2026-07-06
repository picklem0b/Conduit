import { query } from "@db/postgres/postgres.client";
import { recordSuccess, recordError } from "@db/redis/redis.usage";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CascadeReason =
   | "rate_limited"
   | "error"
   | "cost_cap"
   | "token_threshold"
   | "unconfigured";

export interface CascadeEventInput {
   conversationId?: string;
   fromModel: string;
   toModel: string;
   reason: CascadeReason;
   profile: string;
   latencyMs?: number;
}

export interface UsageSummary {
   provider: string;
   requestCount: number;
   errorCount: number;
   rateLimitHits: number;
   avgLatencyMs: number;
   totalTokens: number;
   totalCostUsd: number;
}

// ── Gateway-side writes ───────────────────────────────────────────────────────

/**
 * Records a successful provider request. Writes to Redis (hot path) for live
 * health scoring. The engine aggregator periodically flushes Redis → Postgres.
 */
export async function trackSuccess(
   provider: string,
   latencyMs: number,
   tokens = 0,
   costUsd = 0
): Promise<void> {
   await recordSuccess(provider, latencyMs, tokens, costUsd);
}

/**
 * Records a failed provider request. Same Redis-first approach as trackSuccess.
 */
export async function trackError(
   provider: string,
   kind: "rate_limited" | "error",
   message: string
): Promise<void> {
   await recordError(provider, kind, message);
}

/**
 * Logs a cascade event to Postgres for the runtime dashboard and the engine
 * aggregator. This is a Postgres write (not Redis) because cascade events are
 * durable records used for analytics, not ephemeral counters.
 */
export async function logCascadeEvent(event: CascadeEventInput): Promise<void> {
   await query(
      `INSERT INTO cascade_events
       (conversation_id, from_model, to_model, reason, profile, latency_ms)
     VALUES ($1, $2, $3, $4, $5, $6)`,
      [
         event.conversationId ?? null,
         event.fromModel,
         event.toModel,
         event.reason,
         event.profile,
         event.latencyMs ?? null
      ]
   );
}

// ── Reads (for dashboard/status) ──────────────────────────────────────────────

export async function getRecentCascadeEvents(limit = 50): Promise<
   {
      id: string;
      fromModel: string;
      toModel: string;
      reason: CascadeReason;
      profile: string;
      latencyMs: number | null;
      createdAt: Date;
   }[]
> {
   const { rows } = await query<{
      id: string;
      from_model: string;
      to_model: string;
      reason: CascadeReason;
      profile: string;
      latency_ms: number | null;
      created_at: Date;
   }>(
      `SELECT id, from_model, to_model, reason, profile, latency_ms, created_at
     FROM cascade_events
     ORDER BY created_at DESC
     LIMIT $1`,
      [limit]
   );

   return rows.map(r => ({
      id: r.id,
      fromModel: r.from_model,
      toModel: r.to_model,
      reason: r.reason,
      profile: r.profile,
      latencyMs: r.latency_ms,
      createdAt: r.created_at
   }));
}
