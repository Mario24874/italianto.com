-- Add multi-language translations support to lessons
-- The `translations` column stores {en: {...}, it: {...}} JSON objects
-- The base lesson content (content_html, grammar_notes, vocabulary) stays as default (Spanish)
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
