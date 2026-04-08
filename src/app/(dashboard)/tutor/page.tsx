import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TutorSelector } from '@/components/tutor/tutor-selector'

export const metadata: Metadata = { title: 'Tutor AI — Italianto' }

export default async function TutorPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = getSupabaseAdmin()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_type, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!sub || sub.plan_type === 'free') redirect('/precios')

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto">
      <TutorSelector />
    </div>
  )
}
