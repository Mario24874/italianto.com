'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

// ─── Revenue Area Chart ────────────────────────────────────────────────────
interface RevenueData {
  month: string
  revenue: number
  subscribers: number
}

interface RevenueChartProps {
  data: RevenueData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-dark rounded-xl p-3 shadow-brand text-xs space-y-1.5">
        <div className="font-semibold text-verde-200 mb-1">{label}</div>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="size-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-verde-400">{entry.name}:</span>
            <span className="font-semibold text-verde-200">
              {entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-verde-200">Ingresos mensuales</h3>
          <p className="text-xs text-verde-500 mt-0.5">Últimos 12 meses</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2e7d32" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="subsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4caf50" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4caf50" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,125,50,0.12)" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#4a7c54', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#4a7c54', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#2e7d32"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Plan Distribution Pie Chart ──────────────────────────────────────────
const PLAN_COLORS = {
  free: '#374151',
  essenziale: '#166534',
  avanzato: '#2e7d32',
  maestro: '#f59e0b',
}

interface PlanData {
  plan: string
  count: number
  percentage: number
}

interface PlanChartProps {
  data: PlanData[]
}

export function PlanDistributionChart({ data }: PlanChartProps) {
  return (
    <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-verde-200">Distribución de planes</h3>
        <p className="text-xs text-verde-500 mt-0.5">Suscriptores activos</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="count"
          >
            {data.map((entry) => (
              <Cell
                key={entry.plan}
                fill={PLAN_COLORS[entry.plan as keyof typeof PLAN_COLORS] || '#374151'}
              />
            ))}
          </Pie>
          <Legend
            formatter={(value) => (
              <span className="text-xs text-verde-400 capitalize">{value}</span>
            )}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.[0]) {
                const d = payload[0].payload
                return (
                  <div className="glass-dark rounded-xl p-3 text-xs">
                    <div className="font-semibold text-verde-200 capitalize mb-1">{d.plan}</div>
                    <div className="text-verde-400">{d.count} usuarios ({d.percentage}%)</div>
                  </div>
                )
              }
              return null
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── App Usage Bar Chart ───────────────────────────────────────────────────
import { BarChart, Bar } from 'recharts'

interface AppUsageData {
  app: string
  sessions: number
  avgDuration: number
}

interface AppUsageChartProps {
  data: AppUsageData[]
}

export function AppUsageChart({ data }: AppUsageChartProps) {
  const formatted = data.map(d => ({
    ...d,
    app: d.app === 'italianto_app' ? 'ItaliantoApp' : d.app === 'dialogue_studio' ? 'Studio' : 'Plataforma',
  }))

  return (
    <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-verde-200">Uso por aplicación</h3>
        <p className="text-xs text-verde-500 mt-0.5">Sesiones este mes</p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,125,50,0.12)" vertical={false} />
          <XAxis dataKey="app" tick={{ fill: '#4a7c54', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#4a7c54', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload?.length) {
                return (
                  <div className="glass-dark rounded-xl p-3 text-xs">
                    <div className="font-semibold text-verde-200 mb-1">{label}</div>
                    <div className="text-verde-400">{payload[0].value} sesiones</div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="sessions" fill="#2e7d32" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
