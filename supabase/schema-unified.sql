-- ============================================================
-- ITALIANTO — Schema Unificado para las 3 aplicaciones
-- Proyecto: italianto-unified (UN SOLO proyecto Supabase)
--
-- Apps que comparten este schema:
--   • italianto.com       (plataforma matriz)
--   • app.italianto.com   (ItaliantoApp — React Native)
--   • studio.italianto.com (Dialogue Studio — Next.js)
--
-- INSTRUCCIONES:
-- 1. Crear nuevo proyecto en supabase.com
-- 2. SQL Editor → New Query → pegar este archivo completo → Run
-- 3. Actualizar las 3 apps con las mismas credenciales Supabase
-- ============================================================

-- ─── Limpiar si es re-instalación ────────────────────────────
-- (Descomentar solo si estás reseteando un proyecto existente)
-- drop table if exists app_sessions cascade;
-- drop table if exists usage_metrics cascade;
-- drop table if exists coupons cascade;
-- drop table if exists dialogues cascade;
-- drop table if exists subscriptions cascade;
-- drop table if exists users cascade;
-- drop type if exists plan_type;
-- drop type if exists subscription_status;
-- drop type if exists billing_interval_type;
-- drop type if exists app_type;
-- drop type if exists discount_type;

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_stat_statements"; -- para métricas de queries

-- ─── Enums ───────────────────────────────────────────────────
-- plan_type unifica los nombres de los 3 proyectos:
--   dialogue-studio usaba: basic / standard / pro
--   ItaliantoApp usaba:    free / mensile / annuale
--   italianto-master usa:  free / essenziale / avanzato / maestro
create type plan_type as enum ('free', 'essenziale', 'avanzato', 'maestro');

-- Alias de compatibilidad para dialogue-studio (mapear en código):
--   basic    → essenziale
--   standard → avanzato
--   pro      → maestro

create type subscription_status as enum (
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
  'free'
);

create type billing_interval_type as enum ('month', 'year');

create type app_type as enum (
  'platform',         -- italianto.com
  'italianto_app',    -- app.italianto.com
  'dialogue_studio'   -- studio.italianto.com
);

create type discount_type as enum ('percentage', 'fixed');

-- ═══════════════════════════════════════════════════════════════
-- TABLA: users
-- Sincronizada via Clerk webhook desde las 3 apps.
-- Una sola fila por usuario, compartida entre todas las apps.
-- ═══════════════════════════════════════════════════════════════
create table users (
  id                  text primary key,       -- Clerk user ID (user_xxxx)
  email               text unique not null,
  full_name           text,
  avatar_url          text,
  stripe_customer_id  text unique,            -- Stripe customer ID
  plan_type           plan_type not null default 'free',
  -- Metadatos de registro
  signup_app          app_type default 'platform', -- ¿desde qué app se registró?
  preferred_language  text default 'es',      -- 'es' | 'en' | 'it'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_users_email on users(email);
create index idx_users_plan_type on users(plan_type);
create index idx_users_stripe_customer on users(stripe_customer_id);
create index idx_users_created_at on users(created_at);

-- ═══════════════════════════════════════════════════════════════
-- TABLA: subscriptions
-- Una fila activa por usuario. Controla el acceso a TODAS las apps.
-- ═══════════════════════════════════════════════════════════════
create table subscriptions (
  id                          text primary key,  -- Stripe subscription ID
  user_id                     text not null references users(id) on delete cascade,
  status                      subscription_status not null default 'free',
  plan_type                   plan_type not null default 'free',
  price_id                    text,              -- Stripe price ID
  billing_interval            billing_interval_type,
  amount                      integer,           -- en centavos (ej: $12 = 1200)
  currency                    text not null default 'usd',
  current_period_start        timestamptz,
  current_period_end          timestamptz,
  cancel_at_period_end        boolean not null default false,
  canceled_at                 timestamptz,
  coupon_id                   uuid,              -- cupón aplicado si existe

  -- ── Quotas plataforma (italianto.com) ─────────────────────
  platform_lessons_accessed   integer not null default 0,

  -- ── Quotas ItaliantoApp ───────────────────────────────────
  tutor_minutes_used          integer not null default 0,
  tutor_minutes_reset_at      timestamptz,

  -- ── Quotas Dialogue Studio ────────────────────────────────
  dialogues_used              integer not null default 0,
  audio_used                  integer not null default 0,
  usage_reset_at              timestamptz,       -- fecha de último reset mensual

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_status on subscriptions(status);
create index idx_subscriptions_plan_type on subscriptions(plan_type);
create index idx_subscriptions_period_end on subscriptions(current_period_end);

-- ═══════════════════════════════════════════════════════════════
-- TABLA: dialogues (específica de Dialogue Studio)
-- ═══════════════════════════════════════════════════════════════
create table dialogues (
  id               uuid primary key default uuid_generate_v4(),
  user_id          text not null references users(id) on delete cascade,
  input_text       text not null,
  output_text      text,
  output_type      text default 'written',    -- 'written' | 'audio'
  source_language  text default 'es',         -- 'es' | 'en'
  characters       jsonb,                     -- [{name, gender, voice_id}]
  created_at       timestamptz not null default now()
);

create index idx_dialogues_user_id on dialogues(user_id);
create index idx_dialogues_created_at on dialogues(created_at);

-- ═══════════════════════════════════════════════════════════════
-- TABLA: usage_metrics (analíticas de las 3 apps)
-- ═══════════════════════════════════════════════════════════════
create table usage_metrics (
  id           uuid primary key default uuid_generate_v4(),
  user_id      text not null references users(id) on delete cascade,
  app          app_type not null,
  action       text not null,
  -- Acciones válidas por app:
  --   italianto_app:    'translation' | 'conjugation' | 'pronunciation' | 'tutor_session'
  --   dialogue_studio:  'dialogue_written' | 'dialogue_audio'
  --   platform:         'lesson_view' | 'video_view' | 'download'
  metadata     jsonb,
  recorded_at  timestamptz not null default now()
);

create index idx_usage_metrics_user_id on usage_metrics(user_id);
create index idx_usage_metrics_app on usage_metrics(app);
create index idx_usage_metrics_action on usage_metrics(action);
create index idx_usage_metrics_recorded_at on usage_metrics(recorded_at);

-- ═══════════════════════════════════════════════════════════════
-- TABLA: coupons
-- ═══════════════════════════════════════════════════════════════
create table coupons (
  id                 uuid primary key default uuid_generate_v4(),
  code               text unique not null,
  discount_type      discount_type not null,
  discount_value     numeric not null check (discount_value > 0),
  currency           text,
  applicable_plans   plan_type[] not null default array['essenziale','avanzato','maestro']::plan_type[],
  max_uses           integer,               -- null = ilimitado
  times_used         integer not null default 0,
  expires_at         timestamptz,
  is_active          boolean not null default true,
  created_by         text not null,         -- Clerk user ID del admin
  created_at         timestamptz not null default now()
);

create index idx_coupons_code on coupons(code);
create index idx_coupons_is_active on coupons(is_active);

-- ═══════════════════════════════════════════════════════════════
-- TABLA: app_sessions (para el dashboard de analíticas)
-- ═══════════════════════════════════════════════════════════════
create table app_sessions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          text not null references users(id) on delete cascade,
  app              app_type not null,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_seconds integer,
  ip_address       inet,
  user_agent       text
);

create index idx_app_sessions_user_id on app_sessions(user_id);
create index idx_app_sessions_app on app_sessions(app);
create index idx_app_sessions_started_at on app_sessions(started_at);

-- ═══════════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Auto-update updated_at en users y subscriptions
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at_column();

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at_column();

-- Incrementar quota atómicamente (evita race conditions)
create or replace function increment_quota(
  p_user_id text,
  p_field   text,
  p_amount  integer default 1
) returns void language plpgsql security definer as $$
begin
  execute format(
    'update subscriptions set %I = %I + $1, updated_at = now() where user_id = $2',
    p_field, p_field
  ) using p_amount, p_user_id;
end;
$$;

-- Reset mensual de quotas (llamar el día 1 de cada mes via cron)
create or replace function reset_monthly_quotas()
returns integer language plpgsql security definer as $$
declare
  updated_count integer;
begin
  update subscriptions
  set
    tutor_minutes_used = 0,
    dialogues_used     = 0,
    audio_used         = 0,
    usage_reset_at     = now(),
    tutor_minutes_reset_at = now(),
    updated_at         = now()
  where status = 'active'
    and plan_type != 'free';

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- Verificar si un usuario tiene quota disponible
-- Retorna true si puede realizar la acción
create or replace function check_quota(
  p_user_id text,
  p_field   text,
  p_limit   integer  -- null = ilimitado
) returns boolean language plpgsql security definer as $$
declare
  current_usage integer;
begin
  if p_limit is null then
    return true;
  end if;
  execute format('select %I from subscriptions where user_id = $1', p_field)
  into current_usage
  using p_user_id;
  return coalesce(current_usage, 0) < p_limit;
end;
$$;

-- Keep-alive: query trivial para prevenir pausa de Supabase
create or replace function keep_alive()
returns text language sql security definer as $$
  select 'ok';
$$;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table users enable row level security;
alter table subscriptions enable row level security;
alter table usage_metrics enable row level security;
alter table coupons enable row level security;
alter table app_sessions enable row level security;
alter table dialogues enable row level security;

-- Service role (webhooks y API routes server-side): acceso total
create policy "service_role_users"        on users        for all to service_role using (true) with check (true);
create policy "service_role_subs"         on subscriptions for all to service_role using (true) with check (true);
create policy "service_role_metrics"      on usage_metrics for all to service_role using (true) with check (true);
create policy "service_role_coupons"      on coupons       for all to service_role using (true) with check (true);
create policy "service_role_sessions"     on app_sessions  for all to service_role using (true) with check (true);
create policy "service_role_dialogues"    on dialogues     for all to service_role using (true) with check (true);

-- ═══════════════════════════════════════════════════════════════
-- DATOS INICIALES (ejecutar manualmente en producción)
-- ═══════════════════════════════════════════════════════════════

-- Cupones de lanzamiento (descomentar para insertar):
/*
insert into coupons (code, discount_type, discount_value, applicable_plans, max_uses, is_active, created_by)
values
  ('BIENVENIDO20', 'percentage', 20, array['essenziale','avanzato']::plan_type[], 100, true, 'system'),
  ('MAESTRO30',    'percentage', 30, array['maestro']::plan_type[],               50,  true, 'system'),
  ('LAUNCH50',     'percentage', 50, array['essenziale','avanzato','maestro']::plan_type[], 25, true, 'system');
*/

-- ═══════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- Ejecutar esto para confirmar que todo quedó bien:
-- ═══════════════════════════════════════════════════════════════
/*
select table_name, pg_size_pretty(pg_relation_size(quote_ident(table_name))) as size
from information_schema.tables
where table_schema = 'public'
order by table_name;
*/
