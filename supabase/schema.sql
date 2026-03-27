-- ============================================================
-- ITALIANTO PLATFORM — Supabase PostgreSQL Schema
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ──────────────────────────────────────────────────
create type plan_type as enum ('free', 'essenziale', 'avanzato', 'maestro');
create type subscription_status as enum ('active', 'canceled', 'past_due', 'trialing', 'free');
create type billing_interval as enum ('month', 'year');
create type app_type as enum ('italianto_app', 'dialogue_studio', 'platform');
create type discount_type as enum ('percentage', 'fixed');

-- ─── Users ──────────────────────────────────────────────────
-- Sincronizado con Clerk via webhook
create table users (
  id                  text primary key,              -- Clerk user ID
  email               text unique not null,
  full_name           text,
  avatar_url          text,
  stripe_customer_id  text unique,
  plan_type           plan_type not null default 'free',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_users_email on users(email);
create index idx_users_plan_type on users(plan_type);
create index idx_users_stripe_customer on users(stripe_customer_id);

-- ─── Subscriptions ──────────────────────────────────────────
create table subscriptions (
  id                          text primary key,  -- Stripe subscription ID (o 'free_{user_id}' para free)
  user_id                     text not null references users(id) on delete cascade,
  status                      subscription_status not null default 'free',
  plan_type                   plan_type not null default 'free',
  price_id                    text,
  billing_interval            billing_interval,
  amount                      integer,           -- en centavos USD
  currency                    text not null default 'usd',
  current_period_start        timestamptz,
  current_period_end          timestamptz,
  cancel_at_period_end        boolean not null default false,
  canceled_at                 timestamptz,
  -- Quotas (se resetean mensualmente)
  tutor_minutes_used          integer not null default 0,
  tutor_minutes_reset_at      timestamptz,
  dialogues_used              integer not null default 0,
  audio_used                  integer not null default 0,
  usage_reset_at              timestamptz,
  coupon_id                   text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_status on subscriptions(status);
create index idx_subscriptions_plan_type on subscriptions(plan_type);

-- ─── Usage Metrics ───────────────────────────────────────────
-- Registra cada acción de usuario para analíticas
create table usage_metrics (
  id            uuid primary key default uuid_generate_v4(),
  user_id       text not null references users(id) on delete cascade,
  app           app_type not null,
  action        text not null,        -- 'translation', 'conjugation', 'pronunciation', 'dialogue', 'audio', 'tutor_session'
  metadata      jsonb,                -- datos adicionales de la acción
  recorded_at   timestamptz not null default now()
);

create index idx_usage_metrics_user_id on usage_metrics(user_id);
create index idx_usage_metrics_app on usage_metrics(app);
create index idx_usage_metrics_recorded_at on usage_metrics(recorded_at);
create index idx_usage_metrics_action on usage_metrics(action);

-- ─── Coupons ────────────────────────────────────────────────
create table coupons (
  id                uuid primary key default uuid_generate_v4(),
  code              text unique not null,
  discount_type     discount_type not null,
  discount_value    numeric not null check (discount_value > 0),
  currency          text,              -- solo para tipo 'fixed'
  applicable_plans  plan_type[] not null default array['essenziale','avanzato','maestro']::plan_type[],
  max_uses          integer,           -- null = ilimitado
  times_used        integer not null default 0,
  expires_at        timestamptz,
  is_active         boolean not null default true,
  created_by        text not null,
  created_at        timestamptz not null default now()
);

create index idx_coupons_code on coupons(code);
create index idx_coupons_is_active on coupons(is_active);

-- ─── App Sessions ────────────────────────────────────────────
-- Registra sesiones de uso por app
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

-- ─── Functions ───────────────────────────────────────────────

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at before update on users
  for each row execute function update_updated_at_column();

create trigger subscriptions_updated_at before update on subscriptions
  for each row execute function update_updated_at_column();

-- Incrementar uso de quota atómicamente
create or replace function increment_quota(
  p_user_id text,
  p_field text,
  p_amount integer default 1
) returns void language plpgsql security definer as $$
begin
  execute format(
    'update subscriptions set %I = %I + $1 where user_id = $2',
    p_field, p_field
  ) using p_amount, p_user_id;
end;
$$;

-- Resetear quotas mensuales (llamar desde cron)
create or replace function reset_monthly_quotas()
returns integer language plpgsql security definer as $$
declare
  updated_count integer;
begin
  update subscriptions
  set
    tutor_minutes_used     = 0,
    dialogues_used         = 0,
    audio_used             = 0,
    usage_reset_at         = now(),
    tutor_minutes_reset_at = now(),
    updated_at             = now()
  where status = 'active'
    and plan_type != 'free';

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- ─── Row Level Security ──────────────────────────────────────

alter table users enable row level security;
alter table subscriptions enable row level security;
alter table usage_metrics enable row level security;
alter table coupons enable row level security;
alter table app_sessions enable row level security;

-- Service role: acceso completo (para webhooks y funciones de server)
create policy "service_role_all_users"
  on users for all to service_role using (true);

create policy "service_role_all_subscriptions"
  on subscriptions for all to service_role using (true);

create policy "service_role_all_metrics"
  on usage_metrics for all to service_role using (true);

create policy "service_role_all_coupons"
  on coupons for all to service_role using (true);

create policy "service_role_all_sessions"
  on app_sessions for all to service_role using (true);

-- ─── Sample seed data (for testing) ─────────────────────────
-- Descomentar y ejecutar manualmente en desarrollo

/*
insert into coupons (code, discount_type, discount_value, applicable_plans, max_uses, is_active, created_by)
values
  ('BIENVENIDO20', 'percentage', 20, array['essenziale','avanzato']::plan_type[], 100, true, 'system'),
  ('MAESTRO30', 'percentage', 30, array['maestro']::plan_type[], 50, true, 'system'),
  ('LAUNCH50', 'percentage', 50, array['essenziale','avanzato','maestro']::plan_type[], 25, true, 'system');
*/
