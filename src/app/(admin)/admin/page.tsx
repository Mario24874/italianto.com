import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { StatsCard } from '@/components/admin/stats-card'
import { RevenueChart, PlanDistributionChart, AppUsageChart } from '@/components/admin/revenue-chart'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CreditCard,
  TrendingUp,
  UserCheck,
  Activity,
  DollarSign,
  ArrowUpRight,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import type { SubscriptionRow, UserRow } from '@/types'

export const metadata: Metadata = { title: 'Dashboard Admin' }
export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const supabase = getSupabaseAdmin()

  const [
    { count: totalUsers },
    { data: subscriptions },
    { data: recentUsers },
    { data: usageMetrics },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .neq('plan_type', 'free'),
    supabase
      .from('users')
      .select('*, subscriptions(plan_type, status, amount)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('usage_metrics')
      .select('app, recorded_at')
      .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // MRR calculation
  const mrr = (subscriptions || []).reduce((sum: number, sub: SubscriptionRow) => {
    if (!sub.amount) return sum
    const monthly = sub.billing_interval === 'year' ? sub.amount / 100 / 12 : sub.amount / 100
    return sum + monthly
  }, 0)

  // Plan distribution
  const planCounts = { free: 0, essenziale: 0, avanzato: 0, maestro: 0 }
  ;(subscriptions || []).forEach((sub: SubscriptionRow) => {
    if (sub.plan_type && planCounts[sub.plan_type as keyof typeof planCounts] !== undefined) {
      planCounts[sub.plan_type as keyof typeof planCounts]++
    }
  })
  const total = Object.values(planCounts).reduce((s, c) => s + c, 0) || 1
  const planDistribution = Object.entries(planCounts).map(([plan, count]) => ({
    plan,
    count,
    percentage: Math.round((count / total) * 100),
  }))

  // App usage
  const appCounts: Record<string, number> = {}
  ;(usageMetrics || []).forEach((m: { app: string }) => {
    appCounts[m.app] = (appCounts[m.app] || 0) + 1
  })
  const appUsage = Object.entries(appCounts).map(([app, sessions]) => ({
    app,
    sessions,
    avgDuration: 0,
  }))

  // Mock revenue timeline (replace with real data)
  const months = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar']
  const revenueTimeline = months.map((month, i) => ({
    month,
    revenue: Math.round(mrr * (0.6 + i * 0.06) * (0.9 + Math.random() * 0.2)),
    subscribers: Math.round((subscriptions?.length || 0) * (0.5 + i * 0.07)),
  }))

  return {
    totalUsers: totalUsers || 0,
    activeSubscribers: subscriptions?.length || 0,
    mrr,
    planDistribution,
    appUsage,
    revenueTimeline,
    recentUsers: recentUsers || [],
  }
}

export default async function AdminDashboard() {
  await requireAdmin()
  const data = await getDashboardData()

  const kpis = [
    {
      title: 'Total Usuarios',
      value: data.totalUsers.toLocaleString(),
      icon: Users,
      trend: { value: 12, label: 'vs mes anterior' },
      iconColor: 'text-verde-400',
      iconBg: 'bg-verde-950/60 border-verde-800/40',
    },
    {
      title: 'Suscriptores Activos',
      value: data.activeSubscribers.toLocaleString(),
      icon: UserCheck,
      trend: { value: 8, label: 'vs mes anterior' },
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-950/60 border-blue-800/40',
    },
    {
      title: 'MRR',
      value: formatCurrency(data.mrr),
      icon: DollarSign,
      trend: { value: 15, label: 'vs mes anterior' },
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-950/60 border-amber-800/40',
    },
    {
      title: 'ARR Estimado',
      value: formatCurrency(data.mrr * 12),
      icon: TrendingUp,
      trend: { value: 18, label: 'proyectado' },
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-950/60 border-purple-800/40',
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-verde-50">Dashboard</h1>
          <p className="text-sm text-verde-500 mt-0.5">
            Vista general de la plataforma Italianto
          </p>
        </div>
        <Badge variant="success" dot pulse>
          Sistema operativo
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <StatsCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart data={data.revenueTimeline} />
        </div>
        <PlanDistributionChart data={data.planDistribution} />
      </div>

      {/* App Usage + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AppUsageChart data={data.appUsage.length > 0 ? data.appUsage : [
          { app: 'italianto_app', sessions: 0, avgDuration: 0 },
          { app: 'dialogue_studio', sessions: 0, avgDuration: 0 },
          { app: 'platform', sessions: 0, avgDuration: 0 },
        ]} />

        {/* Recent Users Table */}
        <div className="lg:col-span-2 rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-verde-900/30">
            <div>
              <h3 className="text-sm font-semibold text-verde-200">Usuarios recientes</h3>
              <p className="text-xs text-verde-500">Últimos registros</p>
            </div>
            <Link
              href="/admin/usuarios"
              className="text-xs text-verde-500 hover:text-verde-300 flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-verde-900/20">
            {data.recentUsers.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-verde-600">
                No hay usuarios registrados aún.
              </div>
            )}
            {data.recentUsers.map((user: UserRow & { subscriptions?: { plan_type: string; status: string }[] }) => (
              <div key={user.id} className="flex items-center gap-3 px-5 py-3 hover:bg-verde-950/20 transition-colors">
                <div className="size-8 rounded-full bg-verde-950 border border-verde-800/40 flex items-center justify-center text-xs font-bold text-verde-400 shrink-0">
                  {(user.full_name || user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-verde-200 truncate">
                    {user.full_name || user.email}
                  </div>
                  <div className="text-xs text-verde-500 truncate">{user.email}</div>
                </div>
                <div className="text-right shrink-0">
                  <Badge
                    variant={
                      user.plan_type === 'maestro' ? 'premium' :
                      user.plan_type === 'avanzato' ? 'info' :
                      user.plan_type === 'essenziale' ? 'success' : 'default'
                    }
                    className="text-[10px]"
                  >
                    {user.plan_type}
                  </Badge>
                  <div className="text-[10px] text-verde-600 mt-0.5 flex items-center gap-1 justify-end">
                    <Clock size={9} />
                    {formatDate(user.created_at, 'es-ES', { month: 'short', day: 'numeric', year: undefined })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Crear cupón', href: '/admin/cupones', icon: CreditCard, color: 'text-verde-400' },
          { label: 'Ver ventas', href: '/admin/ventas', icon: TrendingUp, color: 'text-amber-400' },
          { label: 'Analíticas', href: '/admin/analiticas', icon: Activity, color: 'text-purple-400' },
          { label: 'Gestionar usuarios', href: '/admin/usuarios', icon: Users, color: 'text-blue-400' },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-verde-900/40 bg-bg-dark-2/50 hover:border-verde-700/50 hover:bg-verde-950/30 transition-all group"
          >
            <Icon size={15} className={`${color} group-hover:scale-110 transition-transform`} />
            <span className="text-sm font-medium text-verde-400 group-hover:text-verde-300">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
