-- Weekly lesson access tracking (replaces plan-based lesson gating)
-- Each row = a student accessed a lesson for the first time in a given week
CREATE TABLE IF NOT EXISTS lesson_weekly_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  lesson_id   UUID        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  week_start  DATE        NOT NULL,  -- ISO Monday of the week (date_trunc('week', now())::date)
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id, week_start)
);

CREATE INDEX IF NOT EXISTS lesson_weekly_access_user_week
  ON lesson_weekly_access (user_id, week_start);

-- Enable RLS; only service role (admin) can manage
ALTER TABLE lesson_weekly_access ENABLE ROW LEVEL SECURITY;

-- No user-facing policies needed: server uses service role key
