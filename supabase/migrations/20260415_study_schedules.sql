-- Tabla de sesiones de estudio semanales recurrentes
CREATE TABLE IF NOT EXISTS study_schedules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  title        TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'altro',  -- grammatica|vocabolario|ascolto|parlare|lettura|scrittura|tutor|altro
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),  -- 1=Lun .. 7=Dom
  start_hour   INTEGER NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  start_minute INTEGER NOT NULL DEFAULT 0 CHECK (start_minute IN (0, 30)),
  duration_min INTEGER NOT NULL DEFAULT 60 CHECK (duration_min IN (30, 60, 90, 120)),
  reminder_min INTEGER CHECK (reminder_min IN (15, 30, 60, 120)),  -- NULL = sin recordatorio
  reminder_last_sent DATE,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS study_schedules_user_id ON study_schedules(user_id);
CREATE INDEX IF NOT EXISTS study_schedules_day ON study_schedules(day_of_week);

ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own schedules" ON study_schedules
  FOR ALL USING (user_id = auth.uid()::text);
-- Note: API uses service role so RLS is bypassed server-side
