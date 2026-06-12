import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/admin/stats-card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Banknote, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { ReviewButtons } from './_review-buttons'

export const metadata: Metadata = { title: 'Cobranza — Admin' }
export const dynamic = 'force-dynamic'

interface ManualPayment {
  id: string
  email: string
  full_name: string | null
  plan_type: string
  billing_interval: string
  method: string
  reference: string
  amount_usd: number | null
  payer_phone: string | null
  payer_bank: string | null
  note: string | null
  kind: string
  status: string
  admin_note: string | null
  reviewed_by: string | null
  created_at: string
}

interface PaymentFailure {
  id: string
  source: string
  email: string | null
  plan_type: string | null
  amount: number | null
  currency: string | null
  failure_type: string
  failure_message: string | null
  attempt_count: number | null
  next_retry_at: string | null
  status: string
  stripe_invoice_id: string | null
  created_at: string
}

async function getData() {
  const supabase = getSupabaseAdmin()
  const [paymentsRes, failuresRes] = await Promise.all([
    supabase
      .from('manual_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('payment_failures')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
  ])
  return {
    payments: (paymentsRes.data || []) as ManualPayment[],
    failures: (failuresRes.data || []) as PaymentFailure[],
  }
}

const PAYMENT_STATUS = {
  pending: { label: 'Pendiente', variant: 'warning' as const },
  approved: { label: 'Aprobado', variant: 'success' as const },
  rejected: { label: 'Rechazado', variant: 'error' as const },
}

const FAILURE_STATUS = {
  open: { label: 'Abierto', variant: 'error' as const },
  recovered: { label: 'Recuperado', variant: 'success' as const },
  abandoned: { label: 'Abandonado', variant: 'default' as const },
}

export default async function AdminCobranzaPage() {
  await requireAdmin()
  const { payments, failures } = await getData()

  const pending = payments.filter(payment => payment.status === 'pending')
  const openFailures = failures.filter(f => f.status === 'open')
  const recovered = failures.filter(f => f.status === 'recovered').length
  const approvedUsd = payments
    .filter(payment => payment.status === 'approved')
    .reduce((sum, payment) => sum + Number(payment.amount_usd || 0), 0)

  const kpis = [
    {
      title: 'Pagos por verificar',
      value: pending.length.toString(),
      icon: Clock,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-950/60 border-amber-800/40',
    },
    {
      title: 'Fallos de cobro abiertos',
      value: openFailures.length.toString(),
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-950/60 border-red-800/40',
    },
    {
      title: 'Cobros recuperados',
      value: recovered.toString(),
      icon: CheckCircle2,
      iconColor: 'text-verde-400',
      iconBg: 'bg-verde-950/60 border-verde-800/40',
    },
    {
      title: 'Cobrado manual (USD)',
      value: formatCurrency(approvedUsd),
      icon: Banknote,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-950/60 border-purple-800/40',
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-verde-50 flex items-center gap-2.5">
          <Banknote size={24} className="text-verde-400" />
          Cobranza
        </h1>
        <p className="text-sm text-verde-500 mt-0.5">
          Pagos manuales (Pago Móvil / Zelle) y fallos de cobro de Stripe
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <StatsCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* ── Pagos manuales ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-verde-300 uppercase tracking-wide mb-3">
          Pagos manuales reportados
        </h2>
        <div className="rounded-2xl border border-verde-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-verde-900/30 bg-verde-950/30">
                  {['Usuario', 'Plan', 'Método', 'Referencia', 'Monto', 'Tipo', 'Fecha', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-verde-900/20">
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-verde-600">
                      No hay pagos manuales reportados aún.
                    </td>
                  </tr>
                )}
                {payments.map(payment => {
                  const st = PAYMENT_STATUS[payment.status as keyof typeof PAYMENT_STATUS] ?? PAYMENT_STATUS.pending
                  return (
                    <tr key={payment.id} className="hover:bg-verde-950/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-verde-200 truncate max-w-[160px]">
                          {payment.full_name || payment.email}
                        </div>
                        <div className="text-xs text-verde-500 truncate max-w-[160px]">{payment.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="capitalize text-verde-300">{payment.plan_type}</span>
                        <span className="block text-xs text-verde-600">
                          {payment.billing_interval === 'year' ? 'Anual' : 'Mensual'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-verde-400">
                        {payment.method === 'pago_movil' ? 'Pago Móvil' : 'Zelle'}
                        {payment.payer_bank && (
                          <span className="block text-verde-600">{payment.payer_bank} {payment.payer_phone}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-verde-300">{payment.reference}</td>
                      <td className="px-4 py-3.5 font-mono text-verde-300">
                        {payment.amount_usd != null ? formatCurrency(Number(payment.amount_usd)) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-verde-500">
                        {payment.kind === 'renewal' ? 'Renovación' : 'Inicial'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-verde-500 whitespace-nowrap">
                        {formatDate(payment.created_at, 'es-ES', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={st.variant} dot pulse={payment.status === 'pending'}>
                          {st.label}
                        </Badge>
                        {payment.admin_note && (
                          <span className="block text-[11px] text-verde-600 mt-1 max-w-[140px] truncate" title={payment.admin_note}>
                            {payment.admin_note}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {payment.status === 'pending'
                          ? <ReviewButtons paymentId={payment.id} />
                          : <span className="text-xs text-verde-600">{payment.reviewed_by ?? '—'}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Fallos de cobro ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-verde-300 uppercase tracking-wide mb-3">
          Fallos de cobro
        </h2>
        <div className="rounded-2xl border border-verde-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-verde-900/30 bg-verde-950/30">
                  {['Usuario', 'Origen', 'Tipo', 'Monto', 'Intentos', 'Próx. reintento', 'Mensaje', 'Fecha', 'Estado'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-verde-900/20">
                {failures.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-verde-600">
                      Sin fallos de cobro registrados. 🎉
                    </td>
                  </tr>
                )}
                {failures.map(f => {
                  const st = FAILURE_STATUS[f.status as keyof typeof FAILURE_STATUS] ?? FAILURE_STATUS.open
                  return (
                    <tr key={f.id} className="hover:bg-verde-950/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-verde-200 truncate max-w-[160px]">{f.email ?? '—'}</div>
                        {f.plan_type && <div className="text-xs text-verde-500 capitalize">{f.plan_type}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-verde-400">
                        {f.source === 'stripe' ? (
                          f.stripe_invoice_id ? (
                            <a
                              href={`https://dashboard.stripe.com/invoices/${f.stripe_invoice_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-verde-400 hover:text-verde-300 underline underline-offset-2"
                            >
                              Stripe
                            </a>
                          ) : 'Stripe'
                        ) : 'Manual'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-verde-500">
                        {f.failure_type === 'initial' ? 'Inicial' : 'Renovación'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-verde-300">
                        {f.amount != null ? formatCurrency(f.amount / 100, (f.currency || 'usd').toUpperCase()) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-verde-500 text-center">{f.attempt_count ?? '—'}</td>
                      <td className="px-4 py-3.5 text-xs text-verde-500 whitespace-nowrap">
                        {f.next_retry_at
                          ? formatDate(f.next_retry_at, 'es-ES', { month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-verde-500 max-w-[200px] truncate" title={f.failure_message ?? ''}>
                        {f.failure_message ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-verde-500 whitespace-nowrap">
                        {formatDate(f.created_at, 'es-ES', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={st.variant} dot pulse={f.status === 'open'}>
                          {st.label}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
