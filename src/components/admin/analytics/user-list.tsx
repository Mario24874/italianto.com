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
