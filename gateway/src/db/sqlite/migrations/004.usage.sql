CREATE TABLE IF NOT EXISTS usage_hourly (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  provider          TEXT    NOT NULL,
  bucket            TEXT    NOT NULL, -- ISO8601, truncated to the hour
  request_count     INTEGER NOT NULL DEFAULT 0,
  error_count       INTEGER NOT NULL DEFAULT 0,
  rate_limit_hits   INTEGER NOT NULL DEFAULT 0,
  total_latency_ms  INTEGER NOT NULL DEFAULT 0,
  total_tokens      INTEGER NOT NULL DEFAULT 0,
  total_cost_usd    REAL    NOT NULL DEFAULT 0,
  CONSTRAINT usage_hourly_provider_bucket UNIQUE (provider, bucket)
);

CREATE INDEX IF NOT EXISTS idx_usage_hourly_provider
  ON usage_hourly (provider, bucket DESC);

CREATE TABLE IF NOT EXISTS cascade_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT    REFERENCES conversations (id) ON DELETE SET NULL,
  from_model      TEXT    NOT NULL,
  to_model        TEXT    NOT NULL,
  reason          TEXT    NOT NULL CHECK (reason IN ('rate_limited', 'error', 'cost_cap', 'token_threshold', 'unconfigured')),
  profile         TEXT    NOT NULL,
  latency_ms      INTEGER,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cascade_events_created
  ON cascade_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cascade_events_from_model
  ON cascade_events (from_model, created_at DESC);