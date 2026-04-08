import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TutorChat } from '@/components/tutor/tutor-chat'
import type { PlanType } from '@/lib/plans'

export const metadata: Metadata = { title: 'Tutor AI — Italianto' }

export default async function TutorPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = getSupabaseAdmin()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_type, status, tutor_minutes_used')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  const planType = (sub?.plan_type ?? 'free') as PlanType

  if (planType === 'free' || !sub) {
    redirect('/precios')
  }

  const { data: config } = await supabase
    .from('tutor_config')
    .select('tutor_name, avatar_url, elevenlabs_voice_id')
    .eq('id', 'default')
    .maybeSingle()

  return (
    <div className="h-[calc(100vh-64px)]">
      <TutorChat
        tutorName={config?.tutor_name || 'Marco'}
        avatarUrl={config?.avatar_url ?? null}
        voiceId={config?.elevenlabs_voice_id ?? null}
        minutesUsed={sub.tutor_minutes_used ?? 0}
        planType={planType}
      />
    </div>
  )
}
