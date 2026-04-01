import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { PLANS } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export const metadata: Metadata = { title: "L'Aula — Italianto" }

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName || ''

  const supabase = getSupabaseAdmin()
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_type, status, billing_interval, current_period_end, cancel_at_period_end')
    .eq('user_id', user?.id ?? '')
    .eq('status', 'active')
    .maybeSingle()

  const planType = (subscription?.plan_type ?? 'free') as PlanType
  const isPaid = planType !== 'free'
  const planInfo = PLANS.find(p => p.id === planType) ?? null
  const billingInterval = subscription?.billing_interval ?? null
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false

  return (
    <DashboardContent
      firstName={firstName}
      isPaid={isPaid}
      planType={planType}
      planName={planInfo?.name ?? null}
      billingInterval={billingInterval}
      cancelAtPeriodEnd={cancelAtPeriodEnd}
    />
  )
}
