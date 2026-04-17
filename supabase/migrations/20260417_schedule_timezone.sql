-- Add timezone offset to study_schedules
-- tz_offset_min = new Date().getTimezoneOffset() from the browser
-- = (UTC - local time) in minutes
-- Example: Venezuela UTC-4 → tz_offset_min = 240
-- Example: Spain UTC+2 → tz_offset_min = -120
ALTER TABLE study_schedules
  ADD COLUMN IF NOT EXISTS tz_offset_min INTEGER NOT NULL DEFAULT 0;
