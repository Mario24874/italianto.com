-- Tutor session tracking: persistent history, progress stats, and shared quota across web + app
-- Both italianto.com and italiantoapp point to this same Supabase project.
-- The `source` column distinguishes which app originated each session.

CREATE TABLE IF NOT EXISTS tutor_sessions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text        NOT NULL,
  tutor_slug    text,
  nivel         text,
  duration_secs integer     NOT NULL DEFAULT 0,
  turns_count   integer     NOT NULL DEFAULT 0,
  source        text        NOT NULL DEFAULT 'web',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user
  ON tutor_sessions(user_id, created_at DESC);

ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own sessions (inserts happen server-side via service_role)
CREATE POLICY "users_own_sessions" ON tutor_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

-- ── Atomic: insert session + increment quota ──────────────────────────────────
CREATE OR REPLACE FUNCTION save_tutor_session(
  p_user_id      text,
  p_tutor_slug   text,
  p_nivel        text,
  p_duration_secs integer,
  p_turns_count  integer,
  p_source       text DEFAULT 'web'
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_minutes integer;
BEGIN
  -- Ignore sessions shorter than 30 seconds
  IF p_duration_secs < 30 THEN RETURN; END IF;

  INSERT INTO tutor_sessions(user_id, tutor_slug, nivel, duration_secs, turns_count, source)
  VALUES (p_user_id, p_tutor_slug, p_nivel, p_duration_secs, p_turns_count, p_source);

  -- Round up to nearest minute, minimum 1
  v_minutes := GREATEST(1, ROUND(p_duration_secs::numeric / 60));
  PERFORM increment_quota(p_user_id, 'tutor_minutes_used', v_minutes);
END;
$$;

GRANT EXECUTE ON FUNCTION save_tutor_session(text, text, text, integer, integer, text) TO service_role;
