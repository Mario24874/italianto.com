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
