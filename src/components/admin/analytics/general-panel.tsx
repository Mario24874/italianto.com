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
