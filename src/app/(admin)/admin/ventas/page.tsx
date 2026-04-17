import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { StatsCard } from '@/components/admin/stats-card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, UserCheck, XCircle } from 'lucide-react'
import type { SubscriptionRow, UserRow } from '@/types'

export const metadata: Metadata = { title: 'Ventas — Admin' }
export const dynamic = 'force-dynamic'

type SubWithUser = SubscriptionRow & { users: Pick<UserRow, 'full_name' | 'email'> | null }

const PLAN_LABELS: Record<string, string> = { essenziale: 'Essenziale', avanzato: 'Avanzato', maestro: 'Maestro', free: 'Gratis' }
const PLAN_VARIANTS: Record<string, 'success' | 'info' | 'premium' | 'default'> = { essenziale: 'success', avanzato: 'info', maestro: 'premium', free: 'default' }
const STATUS_VARIANTS: Record<string, 'success' | 'error' | 'warning' | 'default'> = { active: 'success', canceled: 'error', past_due: 'warning', trialing: 'info' }
const STATUS_LABELS: Record<string, string> = { active: 'Activa', canceled: 'Cancelada', past_due: 'Vencida', trialing: 'Trial' }

async function getSalesData() {
  const supabase = getSupabaseAdmin()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [{ data: allSubs }, { data: thisMonthNew }, { data: lastMonthNew }] = await Promise.all([
    supabase.from('subscriptions').select('*, users(full_name, email)').neq('plan_type', 'free').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('id').neq('plan_type', 'free').gte('created_at', startOfMonth),
    supabase.from('subscriptions').select('id').neq('plan_type', 'free').gte('created_at', startOfLastMonth).lt('created_at', startOfMonth),
  ])

  const subs = (allSubs ?? []) as SubWithUser[]
  const activeSubs = subs.filter(s => s.status === 'active')
  const mrr = activeSubs.reduce((sum, sub) => {
    if (!sub.amount) return sum
    return sum + (sub.billing_interval === 'year' ? sub.amount / 100 / 12 : sub.amount / 100)
  }, 0)

  const cancellations = subs.filter(s => s.cancel_at_period_end && s.status === 'active').length

  // Revenue by plan
  const byPlan: Record<string, { count: number; mrr: number }> = {}
  for (const sub of activeSubs) {
    if (!byPlan[sub.plan_type]) byPlan[sub.plan_type] = { count: 0, mrr: 0 }
    byPlan[sub.plan_type].count++
    if (sub.amount) {
      byPlan[sub.plan_type].mrr += sub.billing_interval === 'year' ? sub.amount / 100 / 12 : sub.amount / 100
    }
  }

  return {
    subs,
    activeSubs: activeSubs.length,
    mrr,
    newThisMonth: thisMonthNew?.length ?? 0,
    newLastMonth: lastMonthNew?.length ?? 0,
    cancellations,
    byPlan,
  }
}

export default async function AdminVentasPage() {
  await requireAdmin()
  const data = await getSalesData()

  const growth = data.newLastMonth > 0 ? Math.round(((data.newThisMonth - data.newLastMonth) / data.newLastMonth) * 100) : 0

  const kpis = [
    { title: 'MRR', value: formatCurrency(data.mrr), icon: DollarSign, iconColor: 'text-amber-400', iconBg: 'bg-amber-950/60 border-amber-800/40', trend: { value: 0, label: 'ingresos mensuales' } },
    { title: 'ARR Estimado', value: formatCurrency(data.mrr * 12), icon: TrendingUp, iconColor: 'text-verde-400', iconBg: 'bg-verde-950/60 border-verde-800/40' },
    { title: 'Subs Activas', value: data.activeSubs.toString(), icon: UserCheck, iconColor: 'text-blue-400', iconBg: 'bg-blue-950/60 border-blue-800/40', trend: { value: data.newThisMonth, label: 'nuevas este mes' } },
    { title: 'Cancelaciones Pend.', value: data.cancellations.toString(), icon: XCircle, iconColor: 'text-red-400', iconBg: 'bg-red-950/60 border-red-800/40' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-verde-50">Ventas</h1>
        <p className="text-sm text-verde-500">Ingresos y suscripciones en tiempo real</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => <StatsCard key={kpi.title} {...kpi} />)}
      </div>

      {/* By plan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(data.byPlan).map(([plan, stats]) => (
          <div key={plan} className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <Badge variant={PLAN_VARIANTS[plan] ?? 'default'}>{PLAN_LABELS[plan] ?? plan}</Badge>
              <span className="text-xs text-verde-500">{stats.count} subs</span>
            </div>
            <div className="text-2xl font-bold text-verde-100">{formatCurrency(stats.mrr)}</div>
            <div className="text-xs text-verde-500 mt-0.5">MRR este plan</div>
          </div>
        ))}
      </div>

      {/* Subscriptions table */}
      <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 overflow-hidden">
        <div className="px-5 py-4 border-b border-verde-900/30">
          <h3 className="text-sm font-semibold text-verde-200">Todas las Suscripciones</h3>
          <p className="text-xs text-verde-500">Nuevas este mes: <span className="text-verde-300 font-semibold">{data.newThisMonth}</span> ({growth >= 0 ? '+' : ''}{growth}% vs mes anterior)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-verde-900/20">
                {['Usuario', 'Plan', 'Estado', 'Monto', 'Ciclo', 'Creada'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-verde-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-verde-900/10">
              {data.subs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-verde-600">Sin suscripciones</td></tr>
              )}
              {data.subs.map(sub => (
                <tr key={sub.id} className="hover:bg-verde-950/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-verde-200 truncate max-w-[160px]">{sub.users?.full_name || sub.users?.email || '—'}</div>
                    <div className="text-xs text-verde-500 truncate max-w-[160px]">{sub.users?.email}</div>
                  </td>
                  <td className="px-4 py-3"><Badge variant={PLAN_VARIANTS[sub.plan_type] ?? 'default'} className="text-[10px]">{PLAN_LABELS[sub.plan_type] ?? sub.plan_type}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANTS[sub.status] ?? 'default'} className="text-[10px]">{STATUS_LABELS[sub.status] ?? sub.status}{sub.cancel_at_period_end ? ' ↩' : ''}</Badge></td>
                  <td className="px-4 py-3 text-verde-200 font-medium">{sub.amount ? formatCurrency(sub.amount / 100) : '—'}</td>
                  <td className="px-4 py-3 text-verde-400 text-xs capitalize">{sub.billing_interval === 'year' ? 'Anual' : sub.billing_interval === 'month' ? 'Mensual' : '—'}</td>
                  <td className="px-4 py-3 text-verde-500 text-xs">{formatDate(sub.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
