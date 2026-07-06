CREATE TABLE IF NOT EXISTS keys (
  id           TEXT        PRIMARY KEY DEFAULT encode(gen_random_bytes(6), 'hex'),
  provider     TEXT        NOT NULL,
  category     TEXT        NOT NULL DEFAULT 'chat'
                           CHECK (category IN ('chat', 'image', 'search', 'code')),
  label        TEXT        NOT NULL,
  -- Stored as plaintext. Acceptable for self-hosted single-machine deployments.
  -- For multi-tenant hosted deployments, replace with pgcrypto pgp_sym_encrypt.
  key_value    TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT keys_provider_unique UNIQUE (provider)
);

CREATE TRIGGER keys_updated_at
  BEFORE UPDATE ON keys
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Single-row table for version lock state. The CHECK constraint enforces
-- exactly one row ever exists.
CREATE TABLE IF NOT EXISTS license_state (
  id                SMALLINT    PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  installed_version TEXT        NOT NULL DEFAULT '0.0.0-dev',
  minimum_version   TEXT        NOT NULL DEFAULT '0.0.0-dev',
  status            TEXT        NOT NULL DEFAULT 'ok'
                                CHECK (status IN ('ok', 'update_required', 'unknown')),
  last_checked_at   TIMESTAMPTZ
);

INSERT INTO license_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;