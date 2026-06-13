# Analítica de navegación y tiempo por usuario — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar todas las visitas (anónimas y de usuarios registrados) a todas las rutas de los 3 servicios de Italianto, capturar tiempo por sección, y rediseñar el panel admin con vista por usuario, búsqueda, filtros y reportes PDF/CSV.

**Architecture:** Tabla aditiva `page_views` en Supabase + un `PageViewTracker` cliente y un endpoint `/api/analytics/pageview` en el layout raíz de cada servicio (patrón insertar-al-entrar + actualizar-al-salir, igual que `/api/sessions/track`). Un `section-map` por despliegue traduce ruta → `{ section, area }`. El panel admin unificado (`/admin/analiticas` en el servicio `italianto`) lee de `page_views` (+ `app_sessions` para KPIs de sesión) y expone reportes. `VisitTracker`/`page_visits` se retiran tras validar; `SessionTracker`/`app_sessions` se conservan.

**Tech Stack:** Next.js (App Router) · TypeScript · Supabase (`getSupabaseAdmin`, service-role) · Clerk 6 · Tailwind (paleta `verde`) · lucide-react · Vitest (nuevo, solo en `italianto`, para lógica pura) · `@react-pdf/renderer` (nuevo, en `italianto`).

**Spec:** `docs/superpowers/specs/2026-06-13-analitica-navegacion-usuarios-design.md`

**Convención de tests:** los 3 servicios no tienen framework de tests. Se añade Vitest **solo en `italianto`** para las unidades de lógica pura (`section-map`, sanitización CSV, agregaciones). Endpoints, tracker y UI se verifican con `npm run type-check`, `npm run lint`, `npm run build` y verificación manual — coherente con la convención actual del proyecto, sin inflar 3 repos con infraestructura de test de integración.

**Nota de despliegue:** son 3 repos separados (`italianto`, `italiantoapp`, `dialoghi-studio`). No hay paquete compartido, así que el tracker, el endpoint y el `section-map` se replican en cada repo. Cada commit/push se despliega vía el flujo git/EasyPanel del repo correspondiente.

---

## File Structure

### Servicio `italianto` (marketing + aula + admin + reportes)
- Create `supabase/migrations/20260613_page_views.sql` — DDL de `page_views` + índices + RLS.
- Create `src/lib/analytics/section-map.ts` — mapa ruta→`{ section, area }` para marketing y aula.
- Create `src/lib/analytics/section-map.test.ts` — tests del mapa.
- Create `src/lib/analytics/anon-id.ts` — lectura/emisión de la cookie `it_visitor`.
- Create `src/app/api/analytics/pageview/route.ts` — POST (crea) / PATCH (duración).
- Create `src/components/analytics/page-view-tracker.tsx` — tracker cliente.
- Modify `src/app/layout.tsx` — montar `<PageViewTracker />`.
- Create `src/lib/analytics/queries.ts` — consultas/agregaciones del panel (lógica pura + acceso Supabase).
- Create `src/lib/analytics/queries.test.ts` — tests de las funciones puras de agregación.
- Create `src/components/admin/analytics/general-panel.tsx` — Bloque A.
- Create `src/components/admin/analytics/user-list.tsx` — Bloque B (lista + búsqueda + filtros, client).
- Create `src/components/admin/analytics/user-drilldown.tsx` — slide-over por usuario (client).
- Modify `src/app/(admin)/admin/analiticas/page.tsx` — página unificada.
- Create `src/lib/analytics/csv.ts` — generación + sanitización CSV.
- Create `src/lib/analytics/csv.test.ts` — tests de sanitización.
- Create `src/components/admin/analytics/report-pdf.tsx` — documento `@react-pdf/renderer`.
- Create `src/app/api/admin/analytics/report/route.ts` — endpoint de reportes.
- Modify `src/components/layout/admin-sidebar.tsx` — quitar enlace "Sesiones" (fase de retiro).
- Modify `src/app/(marketing)/layout.tsx` — quitar `<VisitTracker />` (fase de retiro).
- Delete (fase de retiro): `src/components/visit-tracker.tsx`, `src/app/(admin)/admin/sesiones/page.tsx`.
- Create `vitest.config.ts` — config de Vitest.

### Servicios `italiantoapp` y `dialoghi-studio` (solo captura)
- Create `src/lib/analytics/section-map.ts` — mapa propio del despliegue.
- Create `src/lib/analytics/anon-id.ts` — idéntico al de `italianto`.
- Create `src/app/api/analytics/pageview/route.ts` — idéntico.
- Create `src/components/analytics/page-view-tracker.tsx` — idéntico.
- Modify `src/app/layout.tsx` — montar `<PageViewTracker />`.

---

## Phase 0 — Tooling (servicio `italianto`)

### Task 0.1: Añadir Vitest y dependencias

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Instalar dependencias**

```bash
cd <repo italianto>
npm install -D vitest@^2
npm install @react-pdf/renderer@^4
```

- [ ] **Step 2: Crear `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
```

- [ ] **Step 3: Añadir script de test a `package.json`**

En `"scripts"` añade:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verificar**

Run: `npm test`
Expected: PASS sin tests (o "No test files found"), sin errores de config.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest and @react-pdf/renderer for analytics"
```

---

## Phase 1 — Modelo de datos (servicio `italianto`)

### Task 1.1: Migración `page_views`

**Files:**
- Create: `supabase/migrations/20260613_page_views.sql`

- [ ] **Step 1: Escribir la migración**

```sql
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
```

- [ ] **Step 2: Aplicar la migración en Supabase**

Ejecutar el SQL en el editor SQL de Supabase del proyecto Italianto (o vía `supabase db push` si el proyecto usa CLI).
Expected: tabla `page_views` creada; `select * from public.page_views limit 1;` devuelve 0 filas sin error.

- [ ] **Step 3: Verificar RLS**

Run (en SQL editor): `select relrowsecurity from pg_class where relname = 'page_views';`
Expected: `t` (true).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260613_page_views.sql
git commit -m "feat(db): add page_views table for navigation analytics"
```

---

## Phase 2 — Lógica compartida (servicio `italianto`)

### Task 2.1: `section-map` con tests (TDD)

**Files:**
- Create: `src/lib/analytics/section-map.ts`
- Test: `src/lib/analytics/section-map.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from 'vitest'
import { resolveSection } from './section-map'

describe('resolveSection', () => {
  it('mapea marketing home', () => {
    expect(resolveSection('/')).toEqual({ section: 'Home', area: 'marketing' })
  })
  it('mapea precios', () => {
    expect(resolveSection('/precios')).toEqual({ section: 'Precios', area: 'marketing' })
  })
  it('agrupa rutas de lanzamiento por prefijo', () => {
    expect(resolveSection('/lancio/guia-verbos')).toEqual({ section: 'Lanzamiento', area: 'marketing' })
  })
  it('mapea rutas del aula a area app', () => {
    expect(resolveSection('/lezioni/saluti')).toEqual({ section: 'Lecciones', area: 'app' })
  })
  it('devuelve Otras para rutas no mapeadas', () => {
    expect(resolveSection('/ruta-desconocida')).toEqual({ section: 'Otras', area: 'app' })
  })
})
```

- [ ] **Step 2: Ejecutar el test (debe fallar)**

Run: `npx vitest run src/lib/analytics/section-map.test.ts`
Expected: FAIL — "resolveSection is not a function".

- [ ] **Step 3: Implementar `section-map.ts`**

```ts
export type Area = 'marketing' | 'app' | 'studio'
export interface SectionInfo { section: string; area: Area }

// Reglas ordenadas: la primera cuyo `test` coincida gana.
// `prefix` coincide con igualdad exacta o como prefijo seguido de '/'.
interface Rule { prefix: string; section: string; area: Area }

const RULES: Rule[] = [
  // Marketing
  { prefix: '/', section: 'Home', area: 'marketing' },
  { prefix: '/precios', section: 'Precios', area: 'marketing' },
  { prefix: '/lancio', section: 'Lanzamiento', area: 'marketing' },
  { prefix: '/contacto', section: 'Contacto', area: 'marketing' },
  { prefix: '/cookies', section: 'Cookies', area: 'marketing' },
  { prefix: '/sobre-nosotros', section: 'Sobre nosotros', area: 'marketing' },
  // Aula (grupo dashboard de este despliegue)
  { prefix: '/dashboard', section: 'Inicio', area: 'app' },
  { prefix: '/lezioni', section: 'Lecciones', area: 'app' },
  { prefix: '/corsi', section: 'Cursos', area: 'app' },
  { prefix: '/canzoni', section: 'Canciones', area: 'app' },
  { prefix: '/tutor', section: 'Tutor', area: 'app' },
  { prefix: '/passatempi', section: 'Pasatiempos', area: 'app' },
  { prefix: '/orario', section: 'Horario', area: 'app' },
  { prefix: '/informazioni', section: 'Información', area: 'app' },
  { prefix: '/downloads', section: 'Descargas', area: 'app' },
  { prefix: '/impostazioni', section: 'Ajustes', area: 'app' },
]

function matches(path: string, prefix: string): boolean {
  if (prefix === '/') return path === '/'
  return path === prefix || path.startsWith(prefix + '/')
}

export function resolveSection(path: string): SectionInfo {
  const clean = path.split('?')[0].replace(/\/+$/, '') || '/'
  for (const r of RULES) {
    if (matches(clean, r.prefix)) return { section: r.section, area: r.area }
  }
  return { section: 'Otras', area: 'app' }
}
```

- [ ] **Step 4: Ejecutar el test (debe pasar)**

Run: `npx vitest run src/lib/analytics/section-map.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/section-map.ts src/lib/analytics/section-map.test.ts
git commit -m "feat(analytics): add section-map with tests"
```

### Task 2.2: Utilidad de cookie `anon_id`

**Files:**
- Create: `src/lib/analytics/anon-id.ts`

- [ ] **Step 1: Implementar**

```ts
import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'

export const ANON_COOKIE = 'it_visitor'

/**
 * Devuelve el anon_id de la cookie; si no existe, genera uno nuevo.
 * `shouldSet` indica si el caller debe emitir Set-Cookie (cookie nueva).
 */
export async function getOrCreateAnonId(): Promise<{ anonId: string; shouldSet: boolean }> {
  const store = await cookies()
  const existing = store.get(ANON_COOKIE)?.value
  if (existing) return { anonId: existing, shouldSet: false }
  return { anonId: randomUUID(), shouldSet: true }
}

export const ANON_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: true,
  domain: '.italianto.com',
  maxAge: 60 * 60 * 24 * 365, // 1 año
  path: '/',
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run type-check`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics/anon-id.ts
git commit -m "feat(analytics): add anon_id cookie helper"
```

---

## Phase 3 — Captura (servicio `italianto`)

### Task 3.1: Endpoint `/api/analytics/pageview`

**Files:**
- Create: `src/app/api/analytics/pageview/route.ts`

- [ ] **Step 1: Implementar el route handler**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { resolveSection } from '@/lib/analytics/section-map'
import { getOrCreateAnonId, ANON_COOKIE, ANON_COOKIE_OPTIONS } from '@/lib/analytics/anon-id'

const MAX_LEN = 512

function clamp(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return v.slice(0, MAX_LEN)
}

export async function POST(req: NextRequest) {
  let body: { path?: string; referrer?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const path = clamp(body.path)
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })
  if (path.startsWith('/admin')) return NextResponse.json({ ok: true, skipped: true })

  const user = await currentUser()
  const { anonId, shouldSet } = await getOrCreateAnonId()
  const { section, area } = resolveSection(path)

  const supabase = getSupabaseAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('page_views')
    .insert({
      user_id: user?.id ?? null,
      anon_id: anonId,
      service: area,
      path,
      section,
      referrer: clamp(body.referrer ?? null),
      user_agent: req.headers.get('user-agent')?.slice(0, MAX_LEN) ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[analytics/pageview] insert', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const res = NextResponse.json({ id: (data as { id: string }).id })
  if (shouldSet) res.cookies.set(ANON_COOKIE, anonId, ANON_COOKIE_OPTIONS)
  return res
}

export async function PATCH(req: NextRequest) {
  let body: { id?: string; duration?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { id, duration } = body
  if (!id || typeof duration !== 'number' || duration < 0 || duration > 86400) {
    return NextResponse.json({ error: 'id and valid duration required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('page_views')
    .update({ duration_seconds: Math.round(duration) })
    .eq('id', id)

  if (error) {
    console.error('[analytics/pageview] update', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verificar tipos y lint**

Run: `npm run type-check && npm run lint`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/analytics/pageview/route.ts
git commit -m "feat(analytics): add pageview capture endpoint"
```

### Task 3.2: Componente `PageViewTracker`

**Files:**
- Create: `src/components/analytics/page-view-tracker.tsx`

- [ ] **Step 1: Implementar**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function PageViewTracker() {
  const pathname = usePathname()
  const idRef = useRef<string | null>(null)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (pathname.startsWith('/admin')) return

    let cancelled = false

    function flush() {
      const id = idRef.current
      if (!id) return
      const duration = Math.round((Date.now() - startRef.current) / 1000)
      idRef.current = null
      const payload = JSON.stringify({ id, duration })
      // sendBeacon es fiable al cerrar/ocultar; fetch keepalive como respaldo.
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/pageview', new Blob([payload], { type: 'application/json' }))
      } else {
        fetch('/api/analytics/pageview', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {})
      }
    }

    async function start() {
      try {
        const res = await fetch('/api/analytics/pageview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pathname, referrer: document.referrer || null }),
        })
        if (!res.ok || cancelled) return
        const { id } = await res.json()
        if (cancelled) return
        idRef.current = id ?? null
        startRef.current = Date.now()
      } catch {
        // no crítico
      }
    }

    function onHide() {
      if (document.visibilityState === 'hidden') flush()
    }

    start()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [pathname])

  return null
}
```

- [ ] **Step 2: Montar en el layout raíz**

Modify `src/app/layout.tsx`: importar y montar dentro de `<Providers>`, junto a `<Analytics />`:

```tsx
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
// ...
<Providers>
  <Analytics />
  <PageViewTracker />
  <CookieCheck />
  {children}
  {/* ...Toaster... */}
</Providers>
```

- [ ] **Step 3: Verificar build y captura manual**

Run: `npm run build`
Expected: build OK.
Manual: `npm run dev`, navegar `/` → `/precios` → `/lancio`, confirmar en Supabase `select path, section, service, duration_seconds, user_id from page_views order by entered_at desc limit 10;` → filas con secciones correctas; al cambiar de ruta la fila previa recibe `duration_seconds`.

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/page-view-tracker.tsx src/app/layout.tsx
git commit -m "feat(analytics): track page views on every route change"
```

---

## Phase 4 — Panel admin unificado (servicio `italianto`)

### Task 4.1: Funciones de agregación puras con tests (TDD)

**Files:**
- Create: `src/lib/analytics/queries.ts`
- Test: `src/lib/analytics/queries.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from 'vitest'
import { aggregateBySection, aggregateUsers, type PageViewRow } from './queries'

const rows: PageViewRow[] = [
  { id: '1', user_id: 'u1', anon_id: 'a1', service: 'app', path: '/lezioni/x', section: 'Lecciones', entered_at: '2026-06-10T10:00:00Z', duration_seconds: 60 },
  { id: '2', user_id: 'u1', anon_id: 'a1', service: 'app', path: '/precios', section: 'Precios', entered_at: '2026-06-10T10:05:00Z', duration_seconds: 30 },
  { id: '3', user_id: null, anon_id: 'a2', service: 'marketing', path: '/', section: 'Home', entered_at: '2026-06-10T11:00:00Z', duration_seconds: null },
]

describe('aggregateBySection', () => {
  it('suma visitas y tiempo por sección', () => {
    const out = aggregateBySection(rows)
    const lecc = out.find(s => s.section === 'Lecciones')!
    expect(lecc.visits).toBe(1)
    expect(lecc.totalSeconds).toBe(60)
    expect(out[0].visits).toBeGreaterThanOrEqual(out[out.length - 1].visits) // ordenado desc
  })
  it('cuenta visitas totales y visitantes únicos por anon_id', () => {
    const out = aggregateBySection(rows)
    expect(out.reduce((s, r) => s + r.visits, 0)).toBe(3)
  })
})

describe('aggregateUsers', () => {
  it('agrupa solo usuarios logueados', () => {
    const out = aggregateUsers(rows)
    expect(out).toHaveLength(1)
    expect(out[0].userId).toBe('u1')
    expect(out[0].pages).toBe(2)
    expect(out[0].totalSeconds).toBe(90)
  })
})
```

- [ ] **Step 2: Ejecutar el test (debe fallar)**

Run: `npx vitest run src/lib/analytics/queries.test.ts`
Expected: FAIL — funciones no definidas.

- [ ] **Step 3: Implementar `queries.ts`**

```ts
import { getSupabaseAdmin } from '@/lib/supabase'

export interface PageViewRow {
  id: string
  user_id: string | null
  anon_id: string
  service: string
  path: string
  section: string
  entered_at: string
  duration_seconds: number | null
}

export interface SectionAgg { section: string; visits: number; totalSeconds: number }
export interface UserAgg { userId: string; pages: number; totalSeconds: number; lastAt: string; sections: SectionAgg[] }

export function aggregateBySection(rows: PageViewRow[]): SectionAgg[] {
  const map = new Map<string, SectionAgg>()
  for (const r of rows) {
    const cur = map.get(r.section) ?? { section: r.section, visits: 0, totalSeconds: 0 }
    cur.visits++
    cur.totalSeconds += r.duration_seconds ?? 0
    map.set(r.section, cur)
  }
  return Array.from(map.values()).sort((a, b) => b.visits - a.visits)
}

export function aggregateUsers(rows: PageViewRow[]): UserAgg[] {
  const map = new Map<string, UserAgg>()
  for (const r of rows) {
    if (!r.user_id) continue
    const cur = map.get(r.user_id) ?? { userId: r.user_id, pages: 0, totalSeconds: 0, lastAt: r.entered_at, sections: [] }
    cur.pages++
    cur.totalSeconds += r.duration_seconds ?? 0
    if (r.entered_at > cur.lastAt) cur.lastAt = r.entered_at
    map.set(r.user_id, cur)
  }
  // sección por usuario
  for (const [uid, agg] of map) {
    agg.sections = aggregateBySection(rows.filter(r => r.user_id === uid))
  }
  return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}

/** Carga page_views en un rango, opcionalmente filtrado por usuario. */
export async function fetchPageViews(fromISO: string, toISO: string, userId?: string): Promise<PageViewRow[]> {
  const supabase = getSupabaseAdmin()
  let q = supabase
    .from('page_views')
    .select('id, user_id, anon_id, service, path, section, entered_at, duration_seconds')
    .gte('entered_at', fromISO)
    .lte('entered_at', toISO)
    .order('entered_at', { ascending: false })
    .limit(5000)
  if (userId) q = q.eq('user_id', userId)
  const { data } = await q
  return (data ?? []) as PageViewRow[]
}

export function uniqueVisitors(rows: PageViewRow[]): number {
  return new Set(rows.map(r => r.anon_id)).size
}
```

- [ ] **Step 4: Ejecutar el test (debe pasar)**

Run: `npx vitest run src/lib/analytics/queries.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/queries.ts src/lib/analytics/queries.test.ts
git commit -m "feat(analytics): add aggregation queries with tests"
```

### Task 4.2: Componente `GeneralPanel` (Bloque A)

**Files:**
- Create: `src/components/admin/analytics/general-panel.tsx`

- [ ] **Step 1: Implementar (server-friendly, recibe datos por props)**

```tsx
import { StatsCard } from '@/components/admin/stats-card'
import { Eye, Users, UserCheck, Clock } from 'lucide-react'
import type { SectionAgg } from '@/lib/analytics/queries'

function fmt(s: number): string {
  if (!s) return '0s'
  const m = Math.floor(s / 60)
  if (m < 1) return `${s}s`
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

interface Props {
  visitsTotal: number
  uniqueVisitors: number
  activeUsers: number
  avgSessionSeconds: number
  sections: SectionAgg[]
  byService: { service: string; visits: number }[]
}

export function GeneralPanel({ visitsTotal, uniqueVisitors, activeUsers, avgSessionSeconds, sections, byService }: Props) {
  const totalVisits = byService.reduce((s, x) => s + x.visits, 0) || 1
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Visitas totales" value={visitsTotal.toString()} icon={Eye} iconColor="text-blue-400" iconBg="bg-blue-950/60 border-blue-800/40" />
        <StatsCard title="Visitantes únicos" value={uniqueVisitors.toString()} icon={Users} iconColor="text-verde-400" iconBg="bg-verde-950/60 border-verde-800/40" />
        <StatsCard title="Usuarios registrados activos" value={activeUsers.toString()} icon={UserCheck} iconColor="text-purple-400" iconBg="bg-purple-950/60 border-purple-800/40" />
        <StatsCard title="Tiempo medio/sesión" value={fmt(avgSessionSeconds)} icon={Clock} iconColor="text-amber-400" iconBg="bg-amber-950/60 border-amber-800/40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-verde-200">Secciones más visitadas</h3>
          {sections.length === 0 ? <p className="text-xs text-verde-600">Sin datos aún</p> : sections.slice(0, 8).map(s => (
            <div key={s.section} className="flex items-center justify-between text-xs">
              <span className="text-verde-300">{s.section}</span>
              <span className="text-verde-500">{s.visits} visitas · {fmt(s.totalSeconds)}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-verde-200">Por servicio</h3>
          {byService.map(b => {
            const pct = Math.round((b.visits / totalVisits) * 100)
            return (
              <div key={b.service}>
                <div className="flex justify-between text-xs text-verde-500 mb-1"><span className="capitalize">{b.service}</span><span>{pct}%</span></div>
                <div className="h-1.5 rounded-full bg-verde-950/40"><div className="h-full rounded-full bg-verde-600" style={{ width: `${pct}%` }} /></div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run type-check`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/analytics/general-panel.tsx
git commit -m "feat(analytics): add general metrics panel"
```

### Task 4.3: Componentes `UserList` + `UserDrilldown` (Bloque B, client)

**Files:**
- Create: `src/components/admin/analytics/user-drilldown.tsx`
- Create: `src/components/admin/analytics/user-list.tsx`

- [ ] **Step 1: Implementar `user-drilldown.tsx`**

```tsx
'use client'

import { X } from 'lucide-react'
import type { UserAgg } from '@/lib/analytics/queries'

function fmt(s: number): string {
  if (!s) return '0s'
  const m = Math.floor(s / 60)
  if (m < 1) return `${s}s`
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export interface DrilldownUser extends UserAgg {
  email: string
  fullName: string | null
  sessions: number
  services: number
  timeline: { entered_at: string; section: string; duration_seconds: number | null }[]
}

export function UserDrilldown({ user, onClose }: { user: DrilldownUser; onClose: () => void }) {
  const maxSec = Math.max(1, ...user.sections.map(s => s.totalSeconds))
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md h-full overflow-y-auto bg-bg-dark-2 border-l border-verde-900/40 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-verde-100">{user.fullName || user.email}</h2>
            <p className="text-xs text-verde-500 font-mono">{user.email}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-verde-500 hover:text-verde-200"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[['Tiempo', fmt(user.totalSeconds)], ['Páginas', user.pages], ['Sesiones', user.sessions], ['Servicios', user.services]].map(([k, v]) => (
            <div key={k as string} className="rounded-xl border border-verde-900/40 bg-bg-dark/40 p-2">
              <div className="text-sm font-bold text-verde-200">{v}</div>
              <div className="text-[10px] text-verde-600">{k}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-verde-500">Tiempo por sección</h3>
          {user.sections.map(s => (
            <div key={s.section}>
              <div className="flex justify-between text-xs text-verde-400 mb-0.5"><span>{s.section}</span><span>{fmt(s.totalSeconds)}</span></div>
              <div className="h-1.5 rounded-full bg-verde-950/40"><div className="h-full rounded-full bg-verde-600" style={{ width: `${Math.round((s.totalSeconds / maxSec) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-verde-500">Recorrido reciente</h3>
          {user.timeline.slice(0, 40).map((t, i) => (
            <div key={i} className="flex justify-between text-xs text-verde-500">
              <span className="text-verde-400">{new Date(t.entered_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <span>{t.section}</span>
              <span className="text-verde-600">{fmt(t.duration_seconds ?? 0)}</span>
            </div>
          ))}
        </div>
        <a href={`/api/admin/analytics/report?scope=user&userId=${encodeURIComponent(user.userId)}&format=pdf`} className="block text-center text-xs font-semibold text-verde-200 border border-verde-800/50 rounded-xl py-2 hover:bg-verde-950/30">Descargar reporte PDF</a>
        <a href={`/api/admin/analytics/report?scope=user&userId=${encodeURIComponent(user.userId)}&format=csv`} className="block text-center text-xs font-semibold text-verde-300 border border-verde-900/40 rounded-xl py-2 hover:bg-verde-950/30">Descargar CSV</a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implementar `user-list.tsx`**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { UserDrilldown, type DrilldownUser } from './user-drilldown'

function fmt(s: number): string {
  if (!s) return '0s'
  const m = Math.floor(s / 60)
  if (m < 1) return `${s}s`
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export function UserList({ users }: { users: DrilldownUser[] }) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<DrilldownUser | null>(null)

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return users
    return users.filter(u => u.email.toLowerCase().includes(t) || (u.fullName ?? '').toLowerCase().includes(t))
  }, [q, users])

  return (
    <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 overflow-hidden">
      <div className="px-5 py-4 border-b border-verde-900/30 flex items-center gap-3">
        <h3 className="text-sm font-semibold text-verde-200">Usuarios</h3>
        <div className="ml-auto relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-verde-600" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o correo…" className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-bg-dark/60 border border-verde-900/40 text-verde-200 placeholder:text-verde-700 focus:outline-none focus:border-verde-700 w-64" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-verde-950/20">
              {['Usuario', 'Correo', 'Sesiones', 'Páginas', 'Tiempo', 'Última actividad'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-verde-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-verde-900/20">
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-verde-600">Sin usuarios</td></tr>}
            {filtered.map(u => (
              <tr key={u.userId} onClick={() => setSelected(u)} className="hover:bg-verde-950/30 cursor-pointer transition-colors">
                <td className="px-4 py-3 text-xs text-verde-200">{u.fullName || '—'}</td>
                <td className="px-4 py-3 text-xs font-mono text-verde-400">{u.email}</td>
                <td className="px-4 py-3 text-xs text-verde-300 tabular-nums">{u.sessions}</td>
                <td className="px-4 py-3 text-xs text-verde-300 tabular-nums">{u.pages}</td>
                <td className="px-4 py-3 text-xs text-verde-300">{fmt(u.totalSeconds)}</td>
                <td className="px-4 py-3 text-xs text-verde-600">{new Date(u.lastAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <UserDrilldown user={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npm run type-check`
Expected: sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/analytics/user-drilldown.tsx src/components/admin/analytics/user-list.tsx
git commit -m "feat(analytics): add user list with search and drilldown"
```

### Task 4.4: Página unificada `/admin/analiticas`

**Files:**
- Modify: `src/app/(admin)/admin/analiticas/page.tsx`

- [ ] **Step 1: Reescribir la página para componer los bloques**

Reemplaza la función `getAnalytics` y el render por una versión que use las nuevas consultas, conservando las KPIs de aprendizaje y reseñas existentes (no se eliminan). Estructura mínima nueva:

```tsx
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchPageViews, aggregateBySection, aggregateUsers, uniqueVisitors } from '@/lib/analytics/queries'
import { GeneralPanel } from '@/components/admin/analytics/general-panel'
import { UserList } from '@/components/admin/analytics/user-list'
import type { DrilldownUser } from '@/components/admin/analytics/user-drilldown'
import { BarChart3 } from 'lucide-react'

export const metadata: Metadata = { title: 'Analíticas — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminAnaliticasPage() {
  await requireAdmin()
  const now = Date.now()
  const fromISO = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  const toISO = new Date(now).toISOString()

  const rows = await fetchPageViews(fromISO, toISO)
  const sections = aggregateBySection(rows)
  const userAggs = aggregateUsers(rows)

  const supabase = getSupabaseAdmin()
  // emails/nombres
  const { data: users } = await supabase.from('users').select('id, email, full_name')
  const userMap = new Map((users ?? []).map((u: { id: string; email: string; full_name: string | null }) => [u.id, u]))
  // sesiones por usuario (de app_sessions) y tiempo medio
  const { data: sessions } = await supabase.from('app_sessions').select('user_id, duration_seconds, started_at').gte('started_at', fromISO)
  const sessionCount = new Map<string, number>()
  let sumDur = 0, nDur = 0
  for (const s of (sessions ?? []) as { user_id: string; duration_seconds: number | null }[]) {
    sessionCount.set(s.user_id, (sessionCount.get(s.user_id) ?? 0) + 1)
    if (s.duration_seconds) { sumDur += s.duration_seconds; nDur++ }
  }

  const byServiceMap = new Map<string, number>()
  for (const r of rows) byServiceMap.set(r.service, (byServiceMap.get(r.service) ?? 0) + 1)

  const drilldownUsers: DrilldownUser[] = userAggs.map(a => {
    const u = userMap.get(a.userId)
    return {
      ...a,
      email: u?.email ?? a.userId.slice(0, 10),
      fullName: u?.full_name ?? null,
      sessions: sessionCount.get(a.userId) ?? 0,
      services: new Set(rows.filter(r => r.user_id === a.userId).map(r => r.service)).size,
      timeline: rows.filter(r => r.user_id === a.userId).map(r => ({ entered_at: r.entered_at, section: r.section, duration_seconds: r.duration_seconds })),
    }
  })

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3">
        <BarChart3 size={24} className="text-purple-400" />
        <div>
          <h1 className="text-2xl font-extrabold text-verde-50">Analíticas</h1>
          <p className="text-sm text-verde-500">Navegación, tiempo por sección y valoraciones (últimos 30 días)</p>
        </div>
        <a href="/api/admin/analytics/report?scope=general&format=pdf" className="ml-auto text-xs font-semibold text-verde-200 border border-verde-800/50 rounded-xl px-3 py-2 hover:bg-verde-950/30">Reporte general PDF</a>
        <a href="/api/admin/analytics/report?scope=general&format=csv" className="text-xs font-semibold text-verde-300 border border-verde-900/40 rounded-xl px-3 py-2 hover:bg-verde-950/30">CSV</a>
      </div>

      <GeneralPanel
        visitsTotal={rows.length}
        uniqueVisitors={uniqueVisitors(rows)}
        activeUsers={userAggs.length}
        avgSessionSeconds={nDur > 0 ? Math.round(sumDur / nDur) : 0}
        sections={sections}
        byService={Array.from(byServiceMap.entries()).map(([service, visits]) => ({ service, visits }))}
      />

      <UserList users={drilldownUsers} />
    </div>
  )
}
```

> Nota: las secciones de aprendizaje/valoraciones que tenía la página original pueden conservarse añadiéndolas debajo; no se eliminan en este plan (cambio quirúrgico). Si el implementador prefiere, las mueve a un componente aparte. Refinar UI con la skill `frontend-design`.

- [ ] **Step 2: Verificar build y manual**

Run: `npm run build`
Expected: build OK.
Manual: `/admin/analiticas` muestra Bloque A con datos reales, lista de usuarios, búsqueda funciona, clic abre drilldown con tiempo por sección y recorrido.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/admin/analiticas/page.tsx"
git commit -m "feat(analytics): unified admin analytics page with per-user drilldown"
```

---

## Phase 5 — Reportes (servicio `italianto`)

### Task 5.1: Generación + sanitización CSV con tests (TDD)

**Files:**
- Create: `src/lib/analytics/csv.ts`
- Test: `src/lib/analytics/csv.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from 'vitest'
import { sanitizeCell, toCSV } from './csv'

describe('sanitizeCell', () => {
  it('prefija celdas peligrosas para evitar CSV injection', () => {
    expect(sanitizeCell('=SUM(A1)')).toBe("'=SUM(A1)")
    expect(sanitizeCell('+1')).toBe("'+1")
    expect(sanitizeCell('-1')).toBe("'-1")
    expect(sanitizeCell('@x')).toBe("'@x")
  })
  it('escapa comillas y comas', () => {
    expect(sanitizeCell('a,b')).toBe('"a,b"')
    expect(sanitizeCell('a"b')).toBe('"a""b"')
  })
  it('deja texto normal intacto', () => {
    expect(sanitizeCell('Lecciones')).toBe('Lecciones')
  })
})

describe('toCSV', () => {
  it('genera cabecera y filas', () => {
    const csv = toCSV(['sec', 'visitas'], [['Home', '3'], ['=mal', '1']])
    expect(csv.split('\n')[0]).toBe('sec,visitas')
    expect(csv).toContain("'=mal")
  })
})
```

- [ ] **Step 2: Ejecutar el test (debe fallar)**

Run: `npx vitest run src/lib/analytics/csv.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `csv.ts`**

```ts
export function sanitizeCell(value: unknown): string {
  let s = value == null ? '' : String(value)
  if (/^[=+\-@]/.test(s)) s = "'" + s
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function toCSV(header: string[], rows: (string | number | null)[][]): string {
  const lines = [header.map(sanitizeCell).join(',')]
  for (const r of rows) lines.push(r.map(sanitizeCell).join(','))
  return lines.join('\n')
}
```

- [ ] **Step 4: Ejecutar el test (debe pasar)**

Run: `npx vitest run src/lib/analytics/csv.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/csv.ts src/lib/analytics/csv.test.ts
git commit -m "feat(analytics): add CSV generation with injection sanitization"
```

### Task 5.2: Documento PDF

**Files:**
- Create: `src/components/admin/analytics/report-pdf.tsx`

- [ ] **Step 1: Implementar el documento `@react-pdf/renderer`**

```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { SectionAgg } from '@/lib/analytics/queries'

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: '#1a2e1a' },
  h1: { fontSize: 18, marginBottom: 4, color: '#2e7d32' },
  meta: { fontSize: 9, color: '#666', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottom: '1pt solid #eee' },
  kpi: { marginBottom: 12 },
})

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
}

interface Props {
  title: string
  subtitle: string
  kpis: { label: string; value: string }[]
  sections: SectionAgg[]
}

export function ReportPDF({ title, subtitle, kpis, sections }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{title}</Text>
        <Text style={s.meta}>{subtitle} · Generado {new Date().toLocaleString('es-ES')}</Text>
        <View style={s.kpi}>
          {kpis.map(k => <View key={k.label} style={s.row}><Text>{k.label}</Text><Text>{k.value}</Text></View>)}
        </View>
        <Text style={{ fontSize: 12, marginVertical: 8 }}>Secciones más visitadas</Text>
        {sections.map(sec => (
          <View key={sec.section} style={s.row}><Text>{sec.section}</Text><Text>{sec.visits} visitas · {fmt(sec.totalSeconds)}</Text></View>
        ))}
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run type-check`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/analytics/report-pdf.tsx
git commit -m "feat(analytics): add PDF report document"
```

### Task 5.3: Endpoint de reportes

**Files:**
- Create: `src/app/api/admin/analytics/report/route.ts`

- [ ] **Step 1: Implementar**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchPageViews, aggregateBySection, uniqueVisitors } from '@/lib/analytics/queries'
import { toCSV } from '@/lib/analytics/csv'
import { ReportPDF } from '@/components/admin/analytics/report-pdf'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await requireAdmin()
  const sp = req.nextUrl.searchParams
  const scope = sp.get('scope') === 'user' ? 'user' : 'general'
  const format = sp.get('format') === 'csv' ? 'csv' : 'pdf'
  const userId = sp.get('userId') ?? undefined
  const now = Date.now()
  const fromISO = sp.get('from') ?? new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  const toISO = sp.get('to') ?? new Date(now).toISOString()

  if (scope === 'user' && !userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const rows = await fetchPageViews(fromISO, toISO, scope === 'user' ? userId : undefined)
  const sections = aggregateBySection(rows)

  let title = 'Reporte general de analítica'
  let subtitle = `Rango ${fromISO.slice(0, 10)} → ${toISO.slice(0, 10)}`
  if (scope === 'user') {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase.from('users').select('email, full_name').eq('id', userId!).single()
    const u = data as { email: string; full_name: string | null } | null
    title = `Reporte de usuario — ${u?.full_name || u?.email || userId}`
    subtitle = `${u?.email ?? ''} · ${subtitle}`
  }

  const headers = { 'Cache-Control': 'no-store' }

  if (format === 'csv') {
    const csv = toCSV(
      ['entered_at', 'service', 'section', 'path', 'user_id', 'anon_id', 'duration_seconds'],
      rows.map(r => [r.entered_at, r.service, r.section, r.path, r.user_id ?? '', r.anon_id, r.duration_seconds ?? '']),
    )
    return new NextResponse(csv, {
      headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="reporte-${scope}.csv"` },
    })
  }

  const kpis = [
    { label: 'Visitas totales', value: String(rows.length) },
    { label: 'Visitantes únicos', value: String(uniqueVisitors(rows)) },
  ]
  const buffer = await renderToBuffer(ReportPDF({ title, subtitle, kpis, sections }))
  return new NextResponse(buffer, {
    headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${scope}.pdf"` },
  })
}
```

- [ ] **Step 2: Verificar build y manual**

Run: `npm run build`
Expected: build OK.
Manual: como admin, abrir `/api/admin/analytics/report?scope=general&format=csv` (descarga CSV correcto) y `...&format=pdf` (descarga PDF). Sin sesión admin → 403/redirect según `requireAdmin`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/analytics/report/route.ts
git commit -m "feat(analytics): add PDF/CSV report endpoint"
```

---

## Phase 6 — Portar la captura a `italiantoapp` y `dialoghi-studio`

> Para CADA uno de los dos repos, replicar la capa de captura. El código es idéntico salvo el `section-map` (rutas propias) y el `area` resultante (`'app'` para italiantoapp, `'studio'` para dialoghi-studio).

### Task 6.1: Captura en `italiantoapp`

**Files (en repo `italiantoapp`):**
- Create: `src/lib/analytics/section-map.ts`
- Create: `src/lib/analytics/anon-id.ts`
- Create: `src/app/api/analytics/pageview/route.ts`
- Create: `src/components/analytics/page-view-tracker.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Copiar `anon-id.ts`, `page-view-tracker.tsx` y `route.ts`** idénticos a los de `italianto` (Tasks 2.2, 3.1, 3.2). Verificar que `italiantoapp` expone `getSupabaseAdmin` en `@/lib/supabase`; si el path difiere, ajustar el import.

- [ ] **Step 2: Crear `section-map.ts` propio**

```ts
export type Area = 'marketing' | 'app' | 'studio'
export interface SectionInfo { section: string; area: Area }
interface Rule { prefix: string; section: string; area: Area }

const RULES: Rule[] = [
  { prefix: '/conjugador', section: 'Conjugador', area: 'app' },
  { prefix: '/traductor', section: 'Traductor', area: 'app' },
  { prefix: '/pronuncia', section: 'Pronunciación', area: 'app' },
  { prefix: '/tutor', section: 'Tutor', area: 'app' },
  { prefix: '/profilo', section: 'Perfil', area: 'app' },
]

function matches(path: string, prefix: string): boolean {
  if (prefix === '/') return path === '/'
  return path === prefix || path.startsWith(prefix + '/')
}

export function resolveSection(path: string): SectionInfo {
  const clean = path.split('?')[0].replace(/\/+$/, '') || '/'
  for (const r of RULES) if (matches(clean, r.prefix)) return { section: r.section, area: r.area }
  return { section: 'Otras', area: 'app' }
}
```

- [ ] **Step 3: Montar `<PageViewTracker />` en `src/app/layout.tsx`** (dentro del provider raíz, junto a donde se montan otros componentes globales).

- [ ] **Step 4: Verificar y desplegar**

Run: `npm run build`
Expected: build OK.
Manual tras deploy: navegar app.italianto.com → confirmar filas con `service='app'` y secciones correctas en `page_views`.

- [ ] **Step 5: Commit (repo italiantoapp)**

```bash
git add src/lib/analytics src/app/api/analytics src/components/analytics/page-view-tracker.tsx src/app/layout.tsx
git commit -m "feat(analytics): add page view tracking to italiantoapp"
```

### Task 6.2: Captura en `dialoghi-studio`

**Files (en repo `dialoghi-studio`):** mismas rutas que 6.1.

- [ ] **Step 1: Copiar `anon-id.ts`, `page-view-tracker.tsx`, `route.ts`** idénticos (ajustar import de `getSupabaseAdmin` si el path difiere). Excluir `/admin*` ya está cubierto en el tracker/endpoint.

- [ ] **Step 2: Crear `section-map.ts` propio**

```ts
export type Area = 'marketing' | 'app' | 'studio'
export interface SectionInfo { section: string; area: Area }
interface Rule { prefix: string; section: string; area: Area }

const RULES: Rule[] = [
  { prefix: '/studio', section: 'Studio', area: 'studio' },
  { prefix: '/pricing', section: 'Precios', area: 'studio' },
  { prefix: '/subscribe', section: 'Suscripción', area: 'studio' },
  { prefix: '/account', section: 'Cuenta', area: 'studio' },
  { prefix: '/about', section: 'Acerca', area: 'studio' },
  { prefix: '/terms', section: 'Términos', area: 'studio' },
  { prefix: '/privacy', section: 'Privacidad', area: 'studio' },
  { prefix: '/cookies', section: 'Cookies', area: 'studio' },
]

function matches(path: string, prefix: string): boolean {
  if (prefix === '/') return path === '/'
  return path === prefix || path.startsWith(prefix + '/')
}

export function resolveSection(path: string): SectionInfo {
  const clean = path.split('?')[0].replace(/\/+$/, '') || '/'
  for (const r of RULES) if (matches(clean, r.prefix)) return { section: r.section, area: r.area }
  return { section: 'Otras', area: 'studio' }
}
```

- [ ] **Step 3: Montar `<PageViewTracker />` en `src/app/layout.tsx`.**

- [ ] **Step 4: Verificar y desplegar**

Run: `npm run build`
Expected: build OK.
Manual tras deploy: navegar studio.italianto.com → filas con `service='studio'`.

- [ ] **Step 5: Commit (repo dialoghi-studio)**

```bash
git add src/lib/analytics src/app/api/analytics src/components/analytics/page-view-tracker.tsx src/app/layout.tsx
git commit -m "feat(analytics): add page view tracking to dialoghi-studio"
```

---

## Phase 7 — Validación y retiro de lo viejo (servicio `italianto`)

### Task 7.1: Validación con datos reales

- [ ] **Step 1: Esperar ~2-3 días** de tráfico real con los 3 servicios desplegados.
- [ ] **Step 2: Verificar en Supabase**

Run (SQL editor):
```sql
select service, count(*) visits, count(distinct anon_id) visitantes,
       count(*) filter (where duration_seconds is not null) con_duracion
from page_views where entered_at > now() - interval '3 days'
group by service;
```
Expected: filas en los 3 servicios (`marketing`, `app`, `studio`); `con_duracion` es una fracción razonable de `visits` (las duraciones se rellenan). Confirmar que el panel `/admin/analiticas` cuadra con estos números y que el drilldown muestra recorridos.

### Task 7.2: Retirar tracker anónimo viejo y página de Sesiones

**Files:**
- Modify: `src/app/(marketing)/layout.tsx` — quitar `<VisitTracker />` y su import.
- Delete: `src/components/visit-tracker.tsx`
- Delete: `src/app/(admin)/admin/sesiones/page.tsx`
- Modify: `src/components/layout/admin-sidebar.tsx` — quitar el enlace a "Sesiones".

- [ ] **Step 1: Quitar `<VisitTracker />` de `(marketing)/layout.tsx`** (eliminar import y el elemento `<VisitTracker />`).

- [ ] **Step 2: Eliminar archivos**

```bash
git rm src/components/visit-tracker.tsx "src/app/(admin)/admin/sesiones/page.tsx"
```

- [ ] **Step 3: Quitar el enlace "Sesiones" de `admin-sidebar.tsx`** (localizar la entrada de nav que apunta a `/admin/sesiones` y eliminarla).

- [ ] **Step 4: Verificar**

Run: `npm run build && npm run lint`
Expected: build OK, sin imports rotos ni referencias a `/admin/sesiones`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(analytics): retire legacy visit tracker and sessions page"
```

> Nota: la tabla `page_visits` puede dejarse en la BD (no estorba) o eliminarse en una migración aparte una vez confirmado que nada la consulta. Fuera de alcance de este plan dejarla; si se quiere borrar, hacerlo en migración separada tras grep `page_visits` = 0 referencias.

---

## Self-Review (cobertura del spec)

- **§4 Modelo de datos** → Task 1.1 (tabla, índices, RLS), Task 2.1 (section-map), Task 2.2 (anon_id cookie). ✅
- **§5 Captura** → Task 3.1 (endpoint POST/PATCH, anónimo permitido, exclusión `/admin`, blindaje), Task 3.2 (tracker en route change + sendBeacon), Phase 6 (3 servicios). ✅
- **§6 Panel unificado** → Task 4.2 (Bloque A), 4.3 (lista + búsqueda + drilldown), 4.4 (página). ✅
- **§7 Reportes** → Task 5.1 (CSV+sanitización), 5.2 (PDF), 5.3 (endpoint, requireAdmin, no-store, ambos ámbitos/formatos). ✅
- **§8 Seguridad** → RLS (1.1), requireAdmin + no-store (5.3), blindaje endpoint (3.1), CSV injection (5.1). ✅
- **§9 Rollout** → Phases 1-7 en el orden aditivo descrito; SessionTracker/app_sessions conservados; retiro en Phase 7. ✅
- **§10 Pruebas** → unit (2.1, 4.1, 5.1), verificación manual en pasos de captura/UI/reportes, validación (7.1). ✅

**Decisiones de implementación documentadas:** Vitest solo en `italianto` para lógica pura; `service` derivado del `section-map` por ruta (resuelve marketing vs aula dentro de `italianto`); las secciones de aprendizaje/valoraciones de la página original se conservan (cambio quirúrgico).

**Filtros por servicio/rango personalizado:** el endpoint de reportes ya acepta `from`/`to`; el panel arranca con 30d fijos. Añadir selectores de rango/servicio en la UI es una mejora incremental sobre `UserList`/página (no bloqueante; el dato y el endpoint ya lo soportan).
