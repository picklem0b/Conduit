CREATE TABLE IF NOT EXISTS keys (
  id           TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(6)))),
  provider     TEXT    NOT NULL,
  category     TEXT    NOT NULL DEFAULT 'chat'
                       CHECK (category IN ('chat', 'image', 'search', 'code')),
  label        TEXT    NOT NULL,
  key_value    TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  CONSTRAINT keys_provider_unique UNIQUE (provider)
);

CREATE TRIGGER IF NOT EXISTS keys_updated_at
  AFTER UPDATE ON keys
  FOR EACH ROW
  BEGIN
    UPDATE keys SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

CREATE TABLE IF NOT EXISTS license_state (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  installed_version TEXT    NOT NULL DEFAULT '0.0.0-dev',
  minimum_version   TEXT    NOT NULL DEFAULT '0.0.0-dev',
  status            TEXT    NOT NULL DEFAULT 'ok'
                            CHECK (status IN ('ok', 'update_required', 'unknown')),
  last_checked_at   TEXT
);

INSERT OR IGNORE INTO license_state (id) VALUES (1);