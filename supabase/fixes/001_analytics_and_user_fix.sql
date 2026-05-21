-- ============================================================
-- Italianto — Analytics tables + data fix
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Visits from public/marketing pages
CREATE TABLE IF NOT EXISTS public.page_visits (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT        NOT NULL,
  page        TEXT        NOT NULL DEFAULT '/',
  referrer    TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public platform reviews (star ratings)
CREATE TABLE IF NOT EXISTS public.platform_reviews (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rating         SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  reviewer_name  TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fix Antonella Zonca: name was set from Mario Moreno's billing data
UPDATE public.users
SET    full_name  = 'Antonella Zonca',
       updated_at = NOW()
WHERE  email = 'antozonca1@gmail.com';
