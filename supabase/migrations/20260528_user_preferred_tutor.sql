-- Add preferred_tutor column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_tutor TEXT;

-- Optional foreign key softly enforced by app (not DB) to avoid migration order issues
-- preferred_tutor stores a tutor slug (e.g. 'marco', 'giulia')
