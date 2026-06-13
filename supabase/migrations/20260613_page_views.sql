-- ═══════════════════════════════════════════════════════════════
-- TABLA: page_views (navegación + tiempo por sección, anónimos + registrados)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.page_views (
  id               uuid        primary key default gen_random_uuid(),
  user_id          text        references public.users(id) on delete cascade,
  anon_id          text        not null,
  service          text        not null,   -- 'marketing' | 'app' | 'studio'
  path             text        not null,
  section          text        not null default 'Otras',
  entered_at       timestamptz not null default now(),
  duration_seconds integer,
  referrer         text,
  user_agent       text
);

create index if not exists idx_page_views_user_id    on public.page_views(user_id);
create index if not exists idx_page_views_section     on public.page_views(section);
create index if not exists idx_page_views_service     on public.page_views(service);
create index if not exists idx_page_views_entered_at  on public.page_views(entered_at);
create index if not exists idx_page_views_anon_id     on public.page_views(anon_id);

-- RLS deny-by-default: solo service-role (server-side) accede; sin políticas públicas.
alter table public.page_views enable row level security;
