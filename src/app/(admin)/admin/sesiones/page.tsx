import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { StatsCard } from '@/components/admin/stats-card'
import { Activity, Clock, Users, Layers } from 'lucide-react'
import { fetchPageViews, aggregateBySection } from '@/lib/analytics/queries'
import { UserList } from '@/components/admin/analytics/user-list'
import type { DrilldownUser } from '@/components/admin/analytics/user-drilldown'

export const metadata: Metadata = { title: 'Sesiones — Admin' }
export const dynamic = 'force-dynamic'

const APP_LABELS: Record<string, string> = { italianto_app: 'ItaliantoApp', dialogue_studio: 'Dialoghi Studio', platform: 'Plataforma' }
const APP_COLORS: Record<string, string> = { italianto_app: 'text-verde-400', dialogue_studio: 'text-blue-400', platform: 'text-purple-400' }

interface SessionRow { user_id: string; app: string; started_at: string; duration_seconds: number | null }

function formatDuration(seconds: number): string {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

async function getSessionData() {
  const supabase = getSupabaseAdmin()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: sessionRows }, { data: userRows }, pvRows] = await Promise.all([
    supabase.from('app_sessions').select('user_id, app, started_at, duration_seconds').gte('started_at', thirtyDaysAgo).order('started_at', { ascending: false }),
    supabase.from('users').select('id, email, full_name'),
    fetchPageViews(thirtyDaysAgo, now.toISOString()),
  ])

  const sessions = (sessionRows ?? []) as SessionRow[]
  const userMap = new Map<string, { email: string; full_name: string | null }>()
  for (const u of (userRows ?? []) as { id: string; email: string; full_name: string | null }[]) {
    userMap.set(u.id, { email: u.email, full_name: u.full_name })
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const uniqueUsers = new Set(sessions.map(s => s.user_id)).size
  const durations = sessions.map(s => s.duration_seconds).filter((d): d is number => !!d)
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
  const byApp: Record<string, number> = {}
  for (const s of sessions) byApp[s.app] = (byApp[s.app] ?? 0) + 1

  // ── Una fila por usuario que inició sesión, ordenada por último login ───────
  type Acc = { userId: string; sessions: number; lastAt: string }
  const accMap = new Map<string, Acc>()
  for (const s of sessions) {
    const cur = accMap.get(s.user_id) ?? { userId: s.user_id, sessions: 0, lastAt: s.started_at }
    cur.sessions++
    if (s.started_at > cur.lastAt) cur.lastAt = s.started_at
    accMap.set(s.user_id, cur)
  }

  const drilldownUsers: DrilldownUser[] = Array.from(accMap.values())
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt))
    .map(acc => {
      const info = userMap.get(acc.userId)
      const userPv = pvRows.filter(r => r.user_id === acc.userId)
      return {
        userId: acc.userId,
        email: info?.email ?? acc.userId.slice(0, 10),
        fullName: info?.full_name ?? null,
        pages: userPv.length,
        totalSeconds: userPv.reduce((s, r) => s + (r.duration_seconds ?? 0), 0),
        lastAt: acc.lastAt,
        sections: aggregateBySection(userPv),
        sessions: acc.sessions,
        services: new Set(userPv.map(r => r.service)).size,
        timeline: userPv.map(r => ({ entered_at: r.entered_at, section: r.section, duration_seconds: r.duration_seconds })),
      }
    })

  return { drilldownUsers, totalSessions, uniqueUsers, avgDuration, byApp }
}

export default async function AdminSesionesPage() {
  await requireAdmin()
  const data = await getSessionData()

  const kpis = [
    { title: 'Sesiones (30d)', value: data.totalSessions.toString(), icon: Activity, iconColor: 'text-verde-400', iconBg: 'bg-verde-950/60 border-verde-800/40' },
    { title: 'Usuarios Únicos', value: data.uniqueUsers.toString(), icon: Users, iconColor: 'text-blue-400', iconBg: 'bg-blue-950/60 border-blue-800/40' },
    { title: 'Duración Promedio', value: formatDuration(data.avgDuration), icon: Clock, iconColor: 'text-amber-400', iconBg: 'bg-amber-950/60 border-amber-800/40' },
    { title: 'Apps Activas', value: Object.keys(data.byApp).length.toString(), icon: Layers, iconColor: 'text-purple-400', iconBg: 'bg-purple-950/60 border-purple-800/40' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-verde-50">Sesiones</h1>
        <p className="text-sm text-verde-500">Usuarios que iniciaron sesión, del más reciente al más antiguo (últimos 30 días)</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => <StatsCard key={kpi.title} {...kpi} />)}
      </div>

      {/* By app */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(data.byApp).map(([app, count]) => {
          const pct = data.totalSessions > 0 ? Math.round((count / data.totalSessions) * 100) : 0
          return (
            <div key={app} className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5 space-y-3">
              <div className={`text-xs font-semibold ${APP_COLORS[app] ?? 'text-verde-400'}`}>{APP_LABELS[app] ?? app}</div>
              <div className="text-3xl font-bold text-verde-100">{count}</div>
              <div>
                <div className="flex justify-between text-xs text-verde-500 mb-1">
                  <span>Proporción</span><span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-verde-950/40">
                  <div className="h-full rounded-full bg-verde-600" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Lista de usuarios (buscable) → click abre el detalle de navegación */}
      <UserList users={data.drilldownUsers} />
    </div>
  )
}
