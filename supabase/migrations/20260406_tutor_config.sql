-- ─── tutor_config ────────────────────────────────────────────────────────────
-- Single-row table that holds the AI tutor's knowledge base and system prompt.
-- Only one row is ever written (id = 'default'). Use UPSERT to update.

CREATE TABLE IF NOT EXISTS tutor_config (
  id                    TEXT PRIMARY KEY DEFAULT 'default',
  knowledge_base        TEXT NOT NULL DEFAULT '',
  system_prompt_template TEXT NOT NULL DEFAULT '',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by            TEXT
);

-- Seed a default empty row so GET always returns something
INSERT INTO tutor_config (id, knowledge_base, system_prompt_template, updated_by)
VALUES (
  'default',
  '',
  '',
  'system'
)
ON CONFLICT (id) DO NOTHING;
