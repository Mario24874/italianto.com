import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { StatsCard } from '@/components/admin/stats-card'
import { formatDate } from '@/lib/utils'
import { BookOpen, TrendingUp, Users, CheckCircle2, BarChart3, Activity } from 'lucide-react'

export const metadata: Metadata = { title: 'Analíticas — Admin' }
export const dynamic = 'force-dynamic'

async function getAnalytics() {
  const supabase = getSupabaseAdmin()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: progressAll },
    { data: progressPassed },
    { data: sessionsLast30 },
    { data: sessionsLast7 },
    { data: topLessons },
    { data: levelStats },
  ] = await Promise.all([
    supabase.from('lesson_progress').select('id', { count: 'exact' }),
    supabase.from('lesson_progress').select('id', { count: 'exact' }).eq('status', 'passed'),
    supabase.from('app_sessions').select('user_id, started_at, duration_seconds').gte('started_at', thirtyDaysAgo),
    supabase.from('app_sessions').select('user_id').gte('started_at', sevenDaysAgo),
    supabase.from('lesson_progress').select('lesson_id, lessons(title, level)').eq('status', 'passed').limit(200),
    supabase.from('lesson_progress').select('lesson_id, status, lessons(level)').limit(500),
  ])

  const totalAttempts = progressAll?.length ?? 0
  const totalPassed = progressPassed?.length ?? 0
  const passRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0

  const sessions30 = sessionsLast30 ?? []
  const uniqueUsers30 = new Set(sessions30.map((s: { user_id: string }) => s.user_id)).size
  const uniqueUsers7 = new Set((sessionsLast7 ?? []).map((s: { user_id: string }) => s.user_id)).size
  const avgDuration = sessions30.length > 0
    ? Math.round(sessions30.reduce((s: number, sess: { duration_seconds: number | null }) => s + (sess.duration_seconds ?? 0), 0) / sessions30.length)
    : 0

  // Top lessons by pass count
  const lessonPassCount: Record<string, { title: string; level: string; count: number }> = {}
  for (const p of (topLessons ?? [])) {
    const lesson = (p as { lesson_id: string; lessons: { title: string; level: string } | null }).lessons
    if (!p.lesson_id || !lesson) continue
    if (!lessonPassCount[p.lesson_id]) lessonPassCount[p.lesson_id] = { title: lesson.title, level: lesson.level, count: 0 }
    lessonPassCount[p.lesson_id].count++
  }
  const topLessonsList = Object.values(lessonPassCount).sort((a, b) => b.count - a.count).slice(0, 5)

  // Level distribution
  const levelDist: Record<string, { attempts: number; passed: number }> = {}
  for (const p of (levelStats ?? [])) {
    const lesson = (p as { lesson_id: string; status: string; lessons: { level: string } | null }).lessons
    if (!lesson) continue
    const lvl = lesson.level
    if (!levelDist[lvl]) levelDist[lvl] = { attempts: 0, passed: 0 }
    levelDist[lvl].attempts++
    if ((p as { status: string }).status === 'passed') levelDist[lvl].passed++
  }

  return { totalAttempts, totalPassed, passRate, uniqueUsers30, uniqueUsers7, avgDuration, sessions30Count: sessions30.length, topLessonsList, levelDist }
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export default async function AdminAnaliticasPage() {
  await requireAdmin()
  const data = await getAnalytics()

  const kpis = [
    { title: 'Intentos Totales', value: data.totalAttempts.toString(), icon: BookOpen, iconColor: 'text-verde-400', iconBg: 'bg-verde-950/60 border-verde-800/40' },
    { title: 'Lecciones Aprobadas', value: data.totalPassed.toString(), icon: CheckCircle2, iconColor: 'text-blue-400', iconBg: 'bg-blue-950/60 border-blue-800/40' },
    { title: 'Tasa de Aprobación', value: `${data.passRate}%`, icon: TrendingUp, iconColor: 'text-amber-400', iconBg: 'bg-amber-950/60 border-amber-800/40' },
    { title: 'Usuarios Activos (30d)', value: data.uniqueUsers30.toString(), icon: Users, iconColor: 'text-purple-400', iconBg: 'bg-purple-950/60 border-purple-800/40' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3">
        <BarChart3 size={24} className="text-purple-400" />
        <div>
          <h1 className="text-2xl font-extrabold text-verde-50">Analíticas</h1>
          <p className="text-sm text-verde-500">Métricas de aprendizaje y uso de la plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => <StatsCard key={kpi.title} {...kpi} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Session stats */}
        <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-verde-400" />
            <h3 className="text-sm font-semibold text-verde-200">Sesiones</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Sesiones (30 días)', value: data.sessions30Count },
              { label: 'Usuarios únicos (30d)', value: data.uniqueUsers30 },
              { label: 'Usuarios únicos (7d)', value: data.uniqueUsers7 },
              { label: 'Duración promedio', value: formatSeconds(data.avgDuration) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-verde-500">{label}</span>
                <span className="text-sm font-semibold text-verde-200">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top lessons */}
        <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-verde-400" />
            <h3 className="text-sm font-semibold text-verde-200">Top Lecciones Aprobadas</h3>
          </div>
          {data.topLessonsList.length === 0 ? (
            <p className="text-xs text-verde-600">Sin datos todavía</p>
          ) : (
            <div className="space-y-2">
              {data.topLessonsList.map((lesson, i) => (
                <div key={lesson.title} className="flex items-center gap-2">
                  <span className="text-xs text-verde-600 w-4">{i + 1}.</span>
                  <span className="text-xs text-verde-300 flex-1 truncate">{lesson.title}</span>
                  <span className="text-xs font-semibold text-verde-400">{lesson.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Level distribution */}
        <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-verde-400" />
            <h3 className="text-sm font-semibold text-verde-200">Distribución por Nivel</h3>
          </div>
          {Object.keys(data.levelDist).length === 0 ? (
            <p className="text-xs text-verde-600">Sin datos todavía</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.levelDist).sort(([a], [b]) => a.localeCompare(b)).map(([level, stats]) => {
                const rate = stats.attempts > 0 ? Math.round((stats.passed / stats.attempts) * 100) : 0
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-verde-300">{level}</span>
                      <span className="text-xs text-verde-500">{stats.passed}/{stats.attempts} ({rate}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-verde-950/40">
                      <div className="h-full rounded-full bg-verde-600 transition-all" style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
