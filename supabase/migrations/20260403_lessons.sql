-- Lecciones de italiano
CREATE TABLE IF NOT EXISTS lessons (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        UNIQUE NOT NULL,
  title         TEXT        NOT NULL,
  level         TEXT        NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  order_index   INTEGER     NOT NULL DEFAULT 0,
  content_html  TEXT        NOT NULL DEFAULT '',
  vocabulary    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  grammar_notes TEXT        NOT NULL DEFAULT '',
  plan_required TEXT        NOT NULL DEFAULT 'free' CHECK (plan_required IN ('free','essenziale','avanzato','maestro')),
  status        TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Progreso de lecciones por usuario
CREATE TABLE IF NOT EXISTS lesson_progress (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL,
  lesson_id    UUID        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  score        INTEGER     NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 10),
  status       TEXT        NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','failed','passed')),
  attempts     INTEGER     NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lessons_order  ON lessons(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_level  ON lessons(level);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lp_user        ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_lesson      ON lesson_progress(lesson_id);
