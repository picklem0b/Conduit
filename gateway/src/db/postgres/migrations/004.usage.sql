-- Hourly aggregated usage per provider. Populated by the engine aggregator,
-- not written by the gateway directly (gateway writes to Redis; engine
-- periodically flushes Redis → Postgres).
CREATE TABLE IF NOT EXISTS usage_hourly (
  id                BIGSERIAL   PRIMARY KEY,
  provider          TEXT        NOT NULL,
  bucket            TIMESTAMPTZ NOT NULL, -- truncated to the hour
  request_count     BIGINT      NOT NULL DEFAULT 0,
  error_count       BIGINT      NOT NULL DEFAULT 0,
  rate_limit_hits   BIGINT      NOT NULL DEFAULT 0,
  total_latency_ms  BIGINT      NOT NULL DEFAULT 0,
  total_tokens      BIGINT      NOT NULL DEFAULT 0,
  total_cost_usd    NUMERIC(12, 8) NOT NULL DEFAULT 0,

  CONSTRAINT usage_hourly_provider_bucket UNIQUE (provider, bucket)
);

CREATE INDEX IF NOT EXISTS idx_usage_hourly_provider
  ON usage_hourly (provider, bucket DESC);

-- Cascade event log — written by the gateway on every model handoff.
-- Used by the engine aggregator and the runtime dashboard.
CREATE TABLE IF NOT EXISTS cascade_events (
  id              BIGSERIAL   PRIMARY KEY,
  conversation_id TEXT        REFERENCES conversations (id) ON DELETE SET NULL,
  from_model      TEXT        NOT NULL,
  to_model        TEXT        NOT NULL,
  reason          TEXT        NOT NULL CHECK (reason IN ('rate_limited', 'error', 'cost_cap', 'token_threshold', 'unconfigured')),
  profile         TEXT        NOT NULL,
  latency_ms      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cascade_events_created
  ON cascade_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cascade_events_from_model
  ON cascade_events (from_model, created_at DESC);