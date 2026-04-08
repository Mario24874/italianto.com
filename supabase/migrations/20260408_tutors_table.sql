-- ─── tutors ───────────────────────────────────────────────────────────────────
-- Multiple tutor personas, each with their own identity and voice.
-- Students pick a tutor before starting a session.

CREATE TABLE IF NOT EXISTS tutors (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT        UNIQUE NOT NULL,
  name                 TEXT        NOT NULL,
  description          TEXT        NOT NULL DEFAULT '',
  avatar_url           TEXT,
  elevenlabs_voice_id  TEXT,
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  sort_order           INTEGER     NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 4 default tutors
INSERT INTO tutors (slug, name, description, elevenlabs_voice_id, sort_order) VALUES
  ('marco',   'Marco',   'Tutor amichevole e paziente, perfetto per principianti (A1-B1)',              'b8jhBTcGAq4kQGWmKprT', 1),
  ('sofia',   'Sofia',   'Specializzata in pronuncia e conversazione avanzata (B1-C1)',                 'EXAVITQu4vr4xnSDxMaL', 2),
  ('lorenzo', 'Lorenzo', 'Esperto di grammatica e scrittura formale, ideale per esami (B2-C2)',         'onwK4e9ZLuTAKqWW03F9', 3),
  ('giulia',  'Giulia',  'Dinamica e creativa, pratica quotidiana e cultura italiana (A2-B2)',          'yoZ06aMxZJJ28mfd3POQ', 4)
ON CONFLICT (slug) DO NOTHING;
