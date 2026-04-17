-- Content sections: songs, activities, info articles, live courses, downloads
-- Contact messages and error logs

CREATE TABLE IF NOT EXISTS songs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        UNIQUE NOT NULL,
  title         text        NOT NULL,
  artist        text        NOT NULL DEFAULT '',
  lyrics        text        NOT NULL DEFAULT '',
  audio_url     text,
  video_url     text,
  level         text        NOT NULL DEFAULT 'A1' CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  plan_required text        NOT NULL DEFAULT 'free' CHECK (plan_required IN ('free','essenziale','avanzato','maestro')),
  status        text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  order_index   int         NOT NULL DEFAULT 0,
  translations  jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        UNIQUE NOT NULL,
  title         text        NOT NULL,
  description   text        NOT NULL DEFAULT '',
  type          text        NOT NULL DEFAULT 'game' CHECK (type IN ('game','quiz','puzzle','crossword','wordmatch')),
  content       jsonb       NOT NULL DEFAULT '{}',
  level         text        NOT NULL DEFAULT 'A1' CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  plan_required text        NOT NULL DEFAULT 'free' CHECK (plan_required IN ('free','essenziale','avanzato','maestro')),
  status        text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  order_index   int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS info_articles (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        UNIQUE NOT NULL,
  title         text        NOT NULL,
  content_html  text        NOT NULL DEFAULT '',
  excerpt       text        NOT NULL DEFAULT '',
  image_url     text,
  category      text        NOT NULL DEFAULT 'cultura' CHECK (category IN ('cultura','gastronomia','viajes','historia','arte','tradiciones','idioma')),
  level         text        NOT NULL DEFAULT 'A1' CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  plan_required text        NOT NULL DEFAULT 'free' CHECK (plan_required IN ('free','essenziale','avanzato','maestro')),
  status        text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  order_index   int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corsi_dal_vivo (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text        UNIQUE NOT NULL,
  title             text        NOT NULL,
  description       text        NOT NULL DEFAULT '',
  instructor        text        NOT NULL DEFAULT '',
  schedule_text     text        NOT NULL DEFAULT '',
  meeting_url       text,
  meeting_platform  text        NOT NULL DEFAULT 'zoom' CHECK (meeting_platform IN ('zoom','meet','teams','other')),
  level             text        NOT NULL DEFAULT 'A1' CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  plan_required     text        NOT NULL DEFAULT 'essenziale' CHECK (plan_required IN ('free','essenziale','avanzato','maestro')),
  status            text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','full','cancelled')),
  max_students      int,
  order_index       int         NOT NULL DEFAULT 0,
  starts_at         timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS downloads (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text        UNIQUE NOT NULL,
  title          text        NOT NULL,
  description    text        NOT NULL DEFAULT '',
  file_url       text        NOT NULL,
  file_type      text        NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf','audio','video','zip','image','doc')),
  size_bytes     bigint,
  level          text        NOT NULL DEFAULT 'A1' CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  plan_required  text        NOT NULL DEFAULT 'free' CHECK (plan_required IN ('free','essenziale','avanzato','maestro')),
  status         text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  order_index    int         NOT NULL DEFAULT 0,
  download_count int         NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      text,
  name         text        NOT NULL DEFAULT '',
  email        text        NOT NULL DEFAULT '',
  phone        text,
  message      text        NOT NULL,
  type         text        NOT NULL DEFAULT 'contact' CHECK (type IN ('contact','comment','bug_report','feature_request')),
  status       text        NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read','replied','resolved')),
  admin_notes  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS error_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  path       text,
  message    text        NOT NULL,
  stack      text,
  user_id    text,
  severity   text        NOT NULL DEFAULT 'error' CHECK (severity IN ('warning','error','critical')),
  resolved   boolean     NOT NULL DEFAULT false,
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
