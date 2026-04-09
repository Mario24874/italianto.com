import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TutorChat } from '@/components/tutor/tutor-chat'
import type { PlanType } from '@/lib/plans'

export const metadata: Metadata = { title: 'Tutor AI — Italianto' }

export default async function TutorChatPage({ params }: { params: { slug: string } }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = getSupabaseAdmin()

  // Check subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_type, status, tutor_minutes_used')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!sub || sub.plan_type === 'free') redirect('/precios')

  // Fetch specific tutor
  const { data: tutor } = await supabase
    .from('tutors')
    .select('slug, name, description, avatar_url, elevenlabs_voice_id, is_active')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!tutor || !tutor.is_active) notFound()

  // Infer gender from common Italian names (used for browser TTS voice selection)
  const maleNames = ['marco', 'giovanni', 'antonio', 'roberto', 'luca', 'andrea', 'giuseppe', 'davide', 'matteo', 'stefano']
  const gender = maleNames.includes(tutor.name.toLowerCase())
    ? 'male' as const
    : 'female' as const

  return (
    <div className="h-[calc(100vh-64px)]">
      <TutorChat
        tutorName={tutor.name}
        tutorSlug={tutor.slug}
        avatarUrl={tutor.avatar_url ?? null}
        voiceId={tutor.elevenlabs_voice_id ?? null}
        gender={gender}
        minutesUsed={sub.tutor_minutes_used ?? 0}
        planType={sub.plan_type as PlanType}
      />
    </div>
  )
}
