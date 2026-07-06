CREATE TABLE IF NOT EXISTS conversations (
  id              TEXT        PRIMARY KEY DEFAULT encode(gen_random_bytes(8), 'hex'),
  title           TEXT        NOT NULL DEFAULT 'New Chat',
  context_summary TEXT,
  interface       TEXT        NOT NULL DEFAULT 'chat'
                              CHECK (interface IN ('chat', 'media', 'tester')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT        PRIMARY KEY DEFAULT encode(gen_random_bytes(8), 'hex'),
  conversation_id TEXT        NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content         TEXT        NOT NULL,
  model           TEXT,
  provider        TEXT,
  -- Approximate token count — stored for usage display, not billing.
  token_count     INTEGER,
  cost_usd        NUMERIC(10, 8),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Primary access pattern: all messages for a conversation, ordered by time.
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages (conversation_id, created_at ASC);

-- Full-text search across message content. GIN index supports fast phrase
-- and keyword searches over the messages table.
CREATE INDEX IF NOT EXISTS idx_messages_content_fts
  ON messages USING GIN (to_tsvector('english', content));