import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/admin/stats-card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Gift, DollarSign, Ticket, Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Gift Cards — Admin' }
export const dynamic = 'force-dynamic'

interface GiftCardRow {
  id: string
  code: string
  plan_type: string
  months: number
  amount_usd: number
  buyer_email: string
  buyer_name: string | null
  recipient_email: string | null
  recipient_name: string | null
  lang: string
  status: string
  paid_at: string | null
  expires_at: string | null
  redeemed_by: string | null
  redeemed_at: string | null
  created_at: string
}

async function getGiftCards(): Promise<GiftCardRow[]> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('gift_cards')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  return (data || []) as GiftCardRow[]
}

const STATUS_MAP = {
  pending: { label: 'Pago pendiente', variant: 'default' as const },
  active: { label: 'Activa', variant: 'success' as const },
  redeemed: { label: 'Canjeada', variant: 'info' as const },
  expired: { label: 'Expirada', variant: 'error' as const },
}

export default async function AdminRegalosPage() {
  await requireAdmin()
  const cards = await getGiftCards()
  const now = new Date()

  const paid = cards.filter(c => c.status !== 'pending')
  const active = cards.filter(
    c => c.status === 'active' && (!c.expires_at || new Date(c.expires_at) > now)
  )
  const redeemed = cards.filter(c => c.status === 'redeemed')
  const revenue = paid.reduce((sum, c) => sum + Number(c.amount_usd || 0), 0)

  const kpis = [
    {
      title: 'Vendidas',
      value: paid.length.toString(),
      icon: Gift,
      iconColor: 'text-verde-400',
      iconBg: 'bg-verde-950/60 border-verde-800/40',
    },
    {
      title: 'Ingresos gift cards',
      value: formatCurrency(revenue),
      icon: DollarSign,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-950/60 border-amber-800/40',
    },
    {
      title: 'Canjeadas',
      value: redeemed.length.toString(),
      icon: Ticket,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-950/60 border-purple-800/40',
    },
    {
      title: 'Sin canjear',
      value: active.length.toString(),
      icon: Clock,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-950/60 border-blue-800/40',
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-verde-50 flex items-center gap-2.5">
          <Gift size={24} className="text-verde-400" />
          Gift Cards
        </h1>
        <p className="text-sm text-verde-500 mt-0.5">
          {cards.length} tarjetas · {active.length} activas sin canjear · {redeemed.length} canjeadas
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
                {['Código', 'Plan', 'Monto', 'Comprador', 'Destinatario', 'Comprada', 'Vence', 'Canjeada por', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-verde-900/20">
              {cards.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-verde-600">
                    No se han vendido gift cards aún.
                  </td>
                </tr>
              )}
              {cards.map(card => {
                const isExpired =
                  card.status === 'active' && card.expires_at && new Date(card.expires_at) < now
                const st = isExpired
                  ? STATUS_MAP.expired
                  : STATUS_MAP[card.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pending
                return (
                  <tr key={card.id} className="hover:bg-verde-950/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-verde-300 whitespace-nowrap">
                      {card.code}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="capitalize text-verde-300">{card.plan_type}</span>
                      <span className="block text-xs text-verde-600">
                        {card.months === 12 ? '1 año' : `${card.months} mes${card.months > 1 ? 'es' : ''}`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-verde-300">
                      {formatCurrency(Number(card.amount_usd))}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-verde-200 truncate max-w-[150px]">{card.buyer_name || '—'}</div>
                      <div className="text-xs text-verde-500 truncate max-w-[150px]">{card.buyer_email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-verde-200 truncate max-w-[150px]">{card.recipient_name || '—'}</div>
                      <div className="text-xs text-verde-500 truncate max-w-[150px]">
                        {card.recipient_email || '(el comprador)'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-verde-500 whitespace-nowrap">
                      {card.paid_at
                        ? formatDate(card.paid_at, 'es-ES', { month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-verde-500 whitespace-nowrap">
                      {card.expires_at
                        ? formatDate(card.expires_at, 'es-ES', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-verde-500 truncate max-w-[140px]">
                      {card.redeemed_by
                        ? `${card.redeemed_by.slice(0, 14)}… · ${card.redeemed_at ? formatDate(card.redeemed_at, 'es-ES', { month: 'short', day: 'numeric' }) : ''}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={st.variant} dot pulse={card.status === 'active' && !isExpired}>
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
  )
}
