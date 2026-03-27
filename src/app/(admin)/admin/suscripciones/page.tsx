import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/admin/stats-card'
import { formatCurrency, formatDate, calcMRR } from '@/lib/utils'
import { CreditCard, TrendingUp, DollarSign, UserCheck, ExternalLink } from 'lucide-react'
import type { SubscriptionRow, UserRow } from '@/types'

export const metadata: Metadata = { title: 'Suscripciones — Admin' }
export const dynamic = 'force-dynamic'

type SubWithUser = SubscriptionRow & { users: UserRow }

async function getSubscriptions(): Promise<SubWithUser[]> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('subscriptions')
    .select('*, users(*)')
    .neq('plan_type', 'free')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data || []) as SubWithUser[]
}

const STATUS_MAP = {
  active: { label: 'Activa', variant: 'success' as const },
  canceled: { label: 'Cancelada', variant: 'error' as const },
  past_due: { label: 'Vencida', variant: 'warning' as const },
  trialing: { label: 'Trial', variant: 'info' as const },
  free: { label: 'Free', variant: 'default' as const },
}

const PLAN_MAP = {
  essenziale: { label: 'Esencial', variant: 'success' as const },
  avanzato: { label: 'Avanzado', variant: 'info' as const },
  maestro: { label: 'Maestro', variant: 'premium' as const },
  free: { label: 'Free', variant: 'default' as const },
}

export default async function AdminSuscripcionesPage() {
  await requireAdmin()
  const subscriptions = await getSubscriptions()

  const active = subscriptions.filter(s => s.status === 'active')
  const mrr = calcMRR(
    active.map(s => ({
      amount: (s.amount || 0) / 100,
      interval: s.billing_interval || 'month',
    }))
  )
  const canceled = subscriptions.filter(s => s.status === 'canceled').length
  const trialing = subscriptions.filter(s => s.status === 'trialing').length

  const kpis = [
    {
      title: 'Suscripciones Activas',
      value: active.length.toString(),
      icon: UserCheck,
      trend: { value: 5, label: 'vs mes anterior' },
      iconColor: 'text-verde-400',
      iconBg: 'bg-verde-950/60 border-verde-800/40',
    },
    {
      title: 'MRR',
      value: formatCurrency(mrr),
      icon: DollarSign,
      trend: { value: 12, label: 'crecimiento' },
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-950/60 border-amber-800/40',
    },
    {
      title: 'ARR',
      value: formatCurrency(mrr * 12),
      icon: TrendingUp,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-950/60 border-purple-800/40',
    },
    {
      title: 'Cancelaciones',
      value: canceled.toString(),
      icon: CreditCard,
      trend: { value: -2, label: 'vs mes anterior' },
      iconColor: 'text-red-400',
      iconBg: 'bg-red-950/60 border-red-800/40',
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-verde-50 flex items-center gap-2.5">
          <CreditCard size={24} className="text-verde-400" />
          Suscripciones
        </h1>
        <p className="text-sm text-verde-500 mt-0.5">
          {subscriptions.length} suscripciones · {active.length} activas · {trialing} en trial
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <StatsCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="rounded-2xl border border-verde-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-verde-900/30 bg-verde-950/30">
                {['Usuario', 'Plan', 'Estado', 'Monto', 'Ciclo', 'Renovación', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-verde-900/20">
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-verde-600">
                    No hay suscripciones aún.
                  </td>
                </tr>
              )}
              {subscriptions.map(sub => {
                const statusInfo = STATUS_MAP[sub.status] || STATUS_MAP.free
                const planInfo = PLAN_MAP[sub.plan_type as keyof typeof PLAN_MAP] || PLAN_MAP.free
                return (
                  <tr key={sub.id} className="hover:bg-verde-950/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-verde-200 truncate max-w-[150px]">
                        {sub.users?.full_name || sub.users?.email || '—'}
                      </div>
                      <div className="text-xs text-verde-500 truncate max-w-[150px]">
                        {sub.users?.email}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={planInfo.variant} className="capitalize">
                        {planInfo.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={statusInfo.variant} dot pulse={sub.status === 'active'}>
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-sm text-verde-300">
                      {sub.amount ? formatCurrency(sub.amount / 100, sub.currency || 'USD') : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-verde-500 capitalize">
                      {sub.billing_interval === 'year' ? 'Anual' : sub.billing_interval ? 'Mensual' : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-verde-500">
                      {sub.current_period_end
                        ? formatDate(sub.current_period_end, 'es-ES', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Ver en Stripe"
                        onClick={() => window.open(`https://dashboard.stripe.com/subscriptions/${sub.id}`, '_blank')}
                      >
                        <ExternalLink size={13} />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
