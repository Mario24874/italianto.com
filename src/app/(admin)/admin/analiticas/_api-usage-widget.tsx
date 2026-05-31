'use client'

import { useEffect, useState } from 'react'
import { Cpu, AlertTriangle, RefreshCw } from 'lucide-react'

interface ApiStats {
  input_tokens: number
  output_tokens: number
  cost_usd: number
  by_api: Record<string, { input: number; output: number; cost: number }>
}

interface UsageData {
  all_time: ApiStats
  today: ApiStats
  month: ApiStats
  recent: { id: string; created_at: string; api: string; route: string; input_tokens: number; output_tokens: number; cost_usd: string }[]
  setup_required?: boolean
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function fmtCost(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(2)}`
}

function StatBlock({ label, stats }: { label: string; stats: ApiStats }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold text-verde-500 uppercase tracking-wide">{label}</p>
      <div className="flex gap-3 flex-wrap">
        <span className="text-sm font-bold text-verde-200">
          {fmt(stats.input_tokens + stats.output_tokens)}
          <span className="text-verde-600 font-normal text-xs ml-1">tokens</span>
        </span>
        <span className="text-sm font-bold text-amber-400">
          {fmtCost(stats.cost_usd)}
          <span className="text-verde-600 font-normal text-xs ml-1">claude</span>
        </span>
      </div>
    </div>
  )
}

export function ApiUsageWidget() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/api-usage')
      if (!res.ok) throw new Error(`${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-verde-500" />
          <h3 className="text-sm font-semibold text-verde-300 uppercase tracking-wide">Consumo de APIs</h3>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1 rounded-lg text-verde-600 hover:text-verde-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="text-xs text-verde-600 animate-pulse">Cargando datos...</div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertTriangle size={12} /> Error: {error}
        </div>
      )}

      {data?.setup_required && (
        <div className="rounded-xl bg-amber-950/20 border border-amber-800/30 px-3 py-2.5 text-xs text-amber-400 space-y-1">
          <p className="font-semibold">⚙️ Configuración requerida</p>
          <p className="text-amber-600">Ejecuta este SQL en Supabase para activar el contador:</p>
          <code className="block bg-black/40 rounded px-2 py-1 text-[10px] text-amber-300 whitespace-pre-wrap">{`create table if not exists api_usage_log (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  api text not null,
  route text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10,6) not null default 0
);`}</code>
        </div>
      )}

      {data && !data.setup_required && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatBlock label="Hoy" stats={data.today} />
            <StatBlock label="Este mes" stats={data.month} />
            <StatBlock label="Total" stats={data.all_time} />
          </div>

          {/* Per-API breakdown */}
          {Object.keys(data.all_time.by_api).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-verde-500 uppercase tracking-wide">Por modelo (total)</p>
              <div className="space-y-1">
                {Object.entries(data.all_time.by_api).map(([api, s]) => (
                  <div key={api} className="flex items-center justify-between text-xs">
                    <span className="text-verde-500 font-mono">{api}</span>
                    <span className="text-verde-300">
                      {fmt(s.input + s.output)} tokens · {fmtCost(s.cost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent calls */}
          {data.recent.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-verde-500 uppercase tracking-wide">Últimas llamadas</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {data.recent.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-[10px] text-verde-600">
                    <span className="font-mono truncate max-w-[120px]">{r.route}</span>
                    <span>{fmt(r.input_tokens + r.output_tokens)}t · {fmtCost(Number(r.cost_usd))}</span>
                    <span className="text-verde-700">{new Date(r.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.recent.length === 0 && (
            <p className="text-xs text-verde-700">Aún no hay llamadas registradas. El contador se actualiza automáticamente con cada traducción.</p>
          )}
        </>
      )}
    </div>
  )
}
