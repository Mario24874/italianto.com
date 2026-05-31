import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { StatsCard } from '@/components/admin/stats-card'
import { formatDate } from '@/lib/utils'
import { BookOpen, TrendingUp, Users, CheckCircle2, BarChart3, Activity, Eye, Star } from 'lucide-react'
import { ApiUsageWidget } from './_api-usage-widget'

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
    // Per-student progress: identify by user_id → join with users.email
    { data: allProgress },
    { data: allUsers },
    // Page visits
    { data: visitsLast30 },
    // Platform reviews
    { data: reviews },
  ] = await Promise.all([
    supabase.from('lesson_progress').select('id', { count: 'exact' }),
    supabase.from('lesson_progress').select('id', { count: 'exact' }).eq('status', 'passed'),
    supabase.from('app_sessions').select('user_id, started_at, duration_seconds').gte('started_at', thirtyDaysAgo),
    supabase.from('app_sessions').select('user_id').gte('started_at', sevenDaysAgo),
    supabase.from('lesson_progress').select('lesson_id, lessons(title, level)').eq('status', 'passed').limit(200),
    supabase.from('lesson_progress').select('lesson_id, status, lessons(level)').limit(500),
    // All progress records to build per-student view
    supabase.from('lesson_progress').select('user_id, status, created_at').order('created_at', { ascending: false }).limit(2000),
    // Users to resolve emails — only those with activity
    supabase.from('users').select('id, email, full_name'),
    // Page visits (last 30 days)
    supabase.from('page_visits').select('session_id, page, created_at').gte('created_at', thirtyDaysAgo),
    // Platform reviews
    supabase.from('platform_reviews').select('id, rating, comment, reviewer_name, status, created_at').order('created_at', { ascending: false }).limit(50),
  ])

  // ── Learning KPIs ──────────────────────────────────────────────────────────
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

  // ── Per-student progress (identified by email) ─────────────────────────────
  const userMap = new Map<string, { email: string; full_name: string | null }>()
  for (const u of (allUsers ?? [])) {
    userMap.set((u as { id: string; email: string; full_name: string | null }).id, {
      email: (u as { id: string; email: string; full_name: string | null }).email,
      full_name: (u as { id: string; email: string; full_name: string | null }).full_name,
    })
  }

  type StudentStat = { email: string; full_name: string | null; attempts: number; passed: number; lastAt: string }
  const studentMap = new Map<string, StudentStat>()

  for (const p of (allProgress ?? [])) {
    const { user_id, status, created_at } = p as { user_id: string; status: string; created_at: string }
    const userInfo = userMap.get(user_id)
    if (!userInfo) continue
    if (!studentMap.has(user_id)) {
      studentMap.set(user_id, { email: userInfo.email, full_name: userInfo.full_name, attempts: 0, passed: 0, lastAt: created_at })
    }
    const stat = studentMap.get(user_id)!
    stat.attempts++
    if (status === 'passed') stat.passed++
    if (created_at > stat.lastAt) stat.lastAt = created_at
  }

  const studentStats = Array.from(studentMap.values())
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt))

  // ── Page visits ────────────────────────────────────────────────────────────
  const visits30 = visitsLast30 ?? []
  const uniqueSessions30 = new Set(visits30.map((v: { session_id: string }) => v.session_id)).size
  const pageCount: Record<string, number> = {}
  for (const v of visits30) {
    const page = (v as { page: string }).page
    pageCount[page] = (pageCount[page] ?? 0) + 1
  }
  const topPages = Object.entries(pageCount).sort(([, a], [, b]) => b - a).slice(0, 5)

  // ── Platform reviews ───────────────────────────────────────────────────────
  const reviewList = (reviews ?? []) as { id: string; rating: number; comment: string | null; reviewer_name: string | null; status: string; created_at: string }[]
  const avgRating = reviewList.length > 0
    ? (reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length).toFixed(1)
    : '—'

  return {
    totalAttempts, totalPassed, passRate, uniqueUsers30, uniqueUsers7, avgDuration,
    sessions30Count: sessions30.length, topLessonsList, levelDist,
    studentStats,
    visitsTotal: visits30.length, uniqueSessions30, topPages,
    reviewList, avgRating,
  }
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-xs tracking-tight">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
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
          <p className="text-sm text-verde-500">Métricas de aprendizaje, visitas y valoraciones</p>
        </div>
      </div>

      {/* Learning KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => <StatsCard key={kpi.title} {...kpi} />)}
      </div>

      {/* API Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ApiUsageWidget />
      </div>

      {/* Sessions + Top Lessons + Level Dist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

      {/* Page visits + Platform reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Page Visits */}
        <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-verde-200">Visitas a la Web (30 días)</h3>
          </div>
          <div className="flex gap-6 pb-2 border-b border-verde-900/30">
            <div>
              <p className="text-2xl font-bold text-verde-100">{data.visitsTotal}</p>
              <p className="text-xs text-verde-600">visitas totales</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-verde-100">{data.uniqueSessions30}</p>
              <p className="text-xs text-verde-600">sesiones únicas</p>
            </div>
          </div>
          {data.topPages.length === 0 ? (
            <p className="text-xs text-verde-600">Sin visitas registradas aún</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-verde-500 uppercase tracking-wide">Páginas más visitadas</p>
              {data.topPages.map(([page, count]) => (
                <div key={page} className="flex items-center justify-between">
                  <span className="text-xs text-verde-400 truncate max-w-[200px] font-mono">{page}</span>
                  <span className="text-xs font-semibold text-verde-300">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Reviews */}
        <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-verde-200">Valoraciones de la Plataforma</h3>
          </div>
          <div className="flex gap-6 pb-2 border-b border-verde-900/30">
            <div>
              <p className="text-2xl font-bold text-verde-100">{data.reviewList.length}</p>
              <p className="text-xs text-verde-600">valoraciones</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">{data.avgRating}</p>
              <p className="text-xs text-verde-600">nota media</p>
            </div>
          </div>
          {data.reviewList.length === 0 ? (
            <p className="text-xs text-verde-600">Sin valoraciones aún</p>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {data.reviewList.slice(0, 8).map(r => (
                <div key={r.id} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <StarRating rating={r.rating} />
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-verde-900/50 text-verde-400' : r.status === 'rejected' ? 'bg-red-900/40 text-red-400' : 'bg-amber-900/30 text-amber-500'}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.reviewer_name && <p className="text-xs text-verde-400 font-medium">{r.reviewer_name}</p>}
                  {r.comment && <p className="text-xs text-verde-600 line-clamp-2">{r.comment}</p>}
                  <p className="text-[10px] text-verde-700">{formatDate(r.created_at, 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-student progress */}
      <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 overflow-hidden">
        <div className="px-5 py-4 border-b border-verde-900/30 flex items-center gap-2">
          <Users size={16} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-verde-200">Progreso por Alumno</h3>
          <span className="ml-auto text-xs text-verde-600">{data.studentStats.length} alumno{data.studentStats.length !== 1 ? 's' : ''} con actividad</span>
        </div>
        {data.studentStats.length === 0 ? (
          <p className="px-5 py-8 text-xs text-verde-600 text-center">Sin actividad de alumnos aún</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-verde-950/20">
                  {['Email (identificador)', 'Nombre', 'Intentos', 'Aprobadas', 'Tasa', 'Última actividad'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-verde-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-verde-900/20">
                {data.studentStats.map(s => {
                  const rate = s.attempts > 0 ? Math.round((s.passed / s.attempts) * 100) : 0
                  return (
                    <tr key={s.email} className="hover:bg-verde-950/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-verde-300">{s.email}</td>
                      <td className="px-4 py-3 text-xs text-verde-400">{s.full_name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-verde-300 tabular-nums">{s.attempts}</td>
                      <td className="px-4 py-3 text-xs text-verde-300 tabular-nums">{s.passed}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${rate >= 70 ? 'text-verde-400' : rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-verde-600">
                        {formatDate(s.lastAt, 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
