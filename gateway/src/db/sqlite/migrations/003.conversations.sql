CREATE TABLE IF NOT EXISTS conversations (
  id              TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  title           TEXT    NOT NULL DEFAULT 'New Chat',
  context_summary TEXT,
  interface       TEXT    NOT NULL DEFAULT 'chat'
                          CHECK (interface IN ('chat', 'media', 'tester')),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS conversations_updated_at
  AFTER UPDATE ON conversations
  FOR EACH ROW
  BEGIN
    UPDATE conversations SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  conversation_id TEXT    NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  role            TEXT    NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content         TEXT    NOT NULL,
  model           TEXT,
  provider        TEXT,
  token_count     INTEGER,
  cost_usd        REAL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages (conversation_id, created_at ASC);

-- SQLite FTS5 for full-text search across message content
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
  content,
  content='messages',
  content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS messages_fts_insert
  AFTER INSERT ON messages BEGIN
    INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
  END;

CREATE TRIGGER IF NOT EXISTS messages_fts_delete
  AFTER DELETE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content)
      VALUES ('delete', old.rowid, old.content);
  END;

CREATE TRIGGER IF NOT EXISTS messages_fts_update
  AFTER UPDATE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content)
      VALUES ('delete', old.rowid, old.content);
    INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
  END;