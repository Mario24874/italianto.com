-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix downloads.level constraint — allow 'all' as a valid level value
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE downloads
  DROP CONSTRAINT IF EXISTS downloads_level_check;

ALTER TABLE downloads
  ADD CONSTRAINT downloads_level_check
  CHECK (level IN ('A1','A2','B1','B2','C1','C2','all'));

-- Update any existing rows that might have an invalid level
UPDATE downloads SET level = 'all' WHERE level NOT IN ('A1','A2','B1','B2','C1','C2','all');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Marketing page visit tracking
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.page_visits (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  text        NOT NULL,
  page        text        NOT NULL DEFAULT '/',
  referrer    text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Platform star ratings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_reviews (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rating         smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        text,
  reviewer_name  text,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Fix Antonella Zonca's name (was set from Mario Moreno's billing data)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.users
SET    full_name  = 'Antonella Zonca',
       updated_at = now()
WHERE  email = 'antozonca1@gmail.com';
