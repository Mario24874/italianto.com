import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { StatsCard } from '@/components/admin/stats-card'
import { formatDate } from '@/lib/utils'
import { Activity, Clock, Users, Layers } from 'lucide-react'
import type { UserRow } from '@/types'

export const metadata: Metadata = { title: 'Sesiones — Admin' }
export const dynamic = 'force-dynamic'

const APP_LABELS: Record<string, string> = { italianto_app: 'ItaliantoApp', dialogue_studio: 'Dialoghi Studio', platform: 'Plataforma' }
const APP_COLORS: Record<string, string> = { italianto_app: 'text-verde-400', dialogue_studio: 'text-blue-400', platform: 'text-purple-400' }

interface AppSession { id: string; user_id: string; app: string; started_at: string; ended_at: string | null; duration_seconds: number | null; users: Pick<UserRow, 'full_name' | 'email'> | null }

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

async function getSessionData() {
  const supabase = getSupabaseAdmin()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('app_sessions')
    .select('id, user_id, app, started_at, ended_at, duration_seconds, users(full_name, email)')
    .gte('started_at', thirtyDaysAgo)
    .order('started_at', { ascending: false })
    .limit(200)

  const sessions = (data ?? []) as AppSession[]
  const totalSessions = sessions.length
  const uniqueUsers = new Set(sessions.map(s => s.user_id)).size
  const avgDuration = sessions.length > 0
    ? Math.round(sessions.filter(s => s.duration_seconds).reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) / sessions.filter(s => s.duration_seconds).length)
    : 0

  const byApp: Record<string, number> = {}
  for (const s of sessions) {
    byApp[s.app] = (byApp[s.app] ?? 0) + 1
  }

  return { sessions, totalSessions, uniqueUsers, avgDuration, byApp }
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
        <p className="text-sm text-verde-500">Actividad de usuarios en la plataforma (últimos 30 días)</p>
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

      {/* Sessions table */}
      <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 overflow-hidden">
        <div className="px-5 py-4 border-b border-verde-900/30">
          <h3 className="text-sm font-semibold text-verde-200">Registro de Sesiones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-verde-900/20">
                {['Usuario', 'App', 'Inicio', 'Duración'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-verde-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-verde-900/10">
              {data.sessions.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-verde-600">Sin sesiones registradas</td></tr>
              )}
              {data.sessions.slice(0, 50).map(session => (
                <tr key={session.id} className="hover:bg-verde-950/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-verde-200 truncate max-w-[180px]">{session.users?.full_name || session.users?.email || session.user_id.slice(0, 8) + '...'}</div>
                    {session.users?.email && <div className="text-xs text-verde-500 truncate max-w-[180px]">{session.users.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${APP_COLORS[session.app] ?? 'text-verde-400'}`}>{APP_LABELS[session.app] ?? session.app}</span>
                  </td>
                  <td className="px-4 py-3 text-verde-400 text-xs">{formatDate(session.started_at)}</td>
                  <td className="px-4 py-3 text-verde-300 font-medium">{formatDuration(session.duration_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
