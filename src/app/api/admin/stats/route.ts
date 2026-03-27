import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { calcMRR } from '@/lib/utils'
import type { SubscriptionRow } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const [
    { count: totalUsers },
    { data: activeSubscriptions },
    { count: newUsersThisMonth },
    { data: appUsage },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*').eq('status', 'active').neq('plan_type', 'free'),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase
      .from('usage_metrics')
      .select('app')
      .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const mrr = calcMRR(
    (activeSubscriptions || []).map((s: SubscriptionRow) => ({
      amount: (s.amount || 0) / 100,
      interval: s.billing_interval || 'month',
    }))
  )

  const planCounts = { free: 0, essenziale: 0, avanzato: 0, maestro: 0 }
  ;(activeSubscriptions || []).forEach((s: SubscriptionRow) => {
    if (s.plan_type in planCounts) {
      planCounts[s.plan_type as keyof typeof planCounts]++
    }
  })

  const appCounts: Record<string, number> = {}
  ;(appUsage || []).forEach((m: { app: string }) => {
    appCounts[m.app] = (appCounts[m.app] || 0) + 1
  })

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    activeSubscribers: activeSubscriptions?.length || 0,
    mrr,
    arr: mrr * 12,
    newUsersThisMonth: newUsersThisMonth || 0,
    planDistribution: Object.entries(planCounts).map(([plan, count]) => ({
      plan,
      count,
    })),
    appUsage: Object.entries(appCounts).map(([app, sessions]) => ({
      app,
      sessions,
    })),
  })
}
