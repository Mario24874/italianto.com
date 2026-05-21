-- Add file_url column to activities for HTML5 game uploads
ALTER TABLE activities ADD COLUMN IF NOT EXISTS file_url text;
