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
  ('marco',   'Marco',   'Tutor amichevole e paziente, adatto a tutti i livelli',                      'b8jhBTcGAq4kQGWmKprT', 1),
  ('sofia',   'Sofia',   'Specializzata in pronuncia e conversazione naturale',                         'EXAVITQu4vr4xnSDxMaL', 2),
  ('lorenzo', 'Lorenzo', 'Esperto di grammatica, scrittura e preparazione agli esami',                  'onwK4e9ZLuTAKqWW03F9', 3),
  ('giulia',  'Giulia',  'Dinamica e creativa, cultura italiana e pratica quotidiana',                  'yoZ06aMxZJJ28mfd3POQ', 4)
ON CONFLICT (slug) DO NOTHING;
