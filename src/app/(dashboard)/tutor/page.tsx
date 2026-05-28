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

  const sb = supabase as unknown as { from: (t: string) => unknown }
  const [subResult, userResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sb.from('subscriptions') as any)
      .select('plan_type, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle() as Promise<{ data: { plan_type: string } | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sb.from('users') as any)
      .select('preferred_tutor')
      .eq('id', userId)
      .maybeSingle() as Promise<{ data: { preferred_tutor?: string | null } | null }>,
  ])

  if (!subResult.data || subResult.data.plan_type === 'free') redirect('/precios')

  // Phase 1: redirect directly to preferred tutor if set
  const preferred = (userResult.data as { preferred_tutor?: string | null } | null)?.preferred_tutor
  if (preferred) redirect(`/tutor/${preferred}`)

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto">
      <TutorSelector />
    </div>
  )
}
