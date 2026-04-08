-- ─── tutor_config v2 ──────────────────────────────────────────────────────────
-- Add tutor identity fields: name, avatar, ElevenLabs voice ID

ALTER TABLE tutor_config
  ADD COLUMN IF NOT EXISTS tutor_name         TEXT NOT NULL DEFAULT 'Marco',
  ADD COLUMN IF NOT EXISTS avatar_url         TEXT,
  ADD COLUMN IF NOT EXISTS elevenlabs_voice_id TEXT;

-- Update existing default row with sensible defaults
UPDATE tutor_config
SET tutor_name = 'Marco'
WHERE id = 'default' AND tutor_name = 'Marco';
