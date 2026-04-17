import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType } from '@/lib/plans'
import { PLANS } from '@/lib/plans'
import { ImpostazioniClient } from './_impostazioni-client'

export const metadata: Metadata = { title: 'Impostazioni — Italianto' }

export default async function ImpostazioniPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = getSupabaseAdmin()
  const [subResult, messagesResult] = await Promise.all([
    supabase.from('subscriptions').select('plan_type,status,billing_interval,current_period_end,cancel_at_period_end').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    supabase.from('contact_messages').select('id,message,type,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  const planType = (subResult.data?.plan_type ?? 'free') as PlanType
  const planInfo = PLANS.find(p => p.id === planType) ?? null
  const messages = messagesResult.data ?? []

  return (
    <ImpostazioniClient
      userId={user.id}
      firstName={user.firstName ?? ''}
      lastName={user.lastName ?? ''}
      email={user.emailAddresses?.[0]?.emailAddress ?? ''}
      imageUrl={user.imageUrl ?? ''}
      planType={planType}
      planName={planInfo?.name ?? null}
      billingInterval={subResult.data?.billing_interval ?? null}
      periodEnd={subResult.data?.current_period_end ?? null}
      cancelAtPeriodEnd={subResult.data?.cancel_at_period_end ?? false}
      myMessages={messages}
    />
  )
}
