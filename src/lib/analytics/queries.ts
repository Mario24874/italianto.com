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
  for (const [uid, agg] of map) {
    agg.sections = aggregateBySection(rows.filter(r => r.user_id === uid))
  }
  return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}

/** Carga page_views en un rango, opcionalmente filtrado por usuario. */
export async function fetchPageViews(fromISO: string, toISO: string, userId?: string): Promise<PageViewRow[]> {
  const supabase = getSupabaseAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
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
