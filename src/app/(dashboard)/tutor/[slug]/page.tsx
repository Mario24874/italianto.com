import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TutorSessionActivator } from '@/components/tutor/tutor-session-activator'
import type { PlanType } from '@/lib/plans'
import { AVATAR_IMAGES_SERVER, GEMINI_VOICE_SERVER } from '@/components/tutor/tutor-constants'

export const metadata: Metadata = { title: 'Tutor AI — Italianto' }

export default async function TutorSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = getSupabaseAdmin()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sub } = await (supabase as any)
    .from('subscriptions')
    .select('plan_type, status, tutor_minutes_used')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle() as { data: { plan_type: string; status: string; tutor_minutes_used: number } | null }

  if (!sub || sub.plan_type === 'free') redirect('/precios')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tutor } = await (supabase as any)
    .from('tutors')
    .select('slug, name, description, avatar_url, elevenlabs_voice_id, is_active')
    .eq('slug', slug)
    .maybeSingle() as { data: { slug: string; name: string; avatar_url: string | null; elevenlabs_voice_id: string | null; is_active: boolean } | null }

  if (!tutor || !tutor.is_active) notFound()

  const validVoices = new Set(['Puck', 'Charon', 'Aoede', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Zephyr'])
  const avatarSrc = AVATAR_IMAGES_SERVER[slug] ?? tutor.avatar_url ?? '/default-avatar.png'
  const geminiVoice = (tutor.elevenlabs_voice_id && validVoices.has(tutor.elevenlabs_voice_id))
    ? tutor.elevenlabs_voice_id
    : GEMINI_VOICE_SERVER[slug] ?? 'Puck'

  return (
    // Empty placeholder — GlobalTutorWidget (in layout) renders TutorLive as fixed overlay
    <div className="h-[calc(100vh-64px)]">
      <TutorSessionActivator tutorData={{
        slug: tutor.slug,
        name: tutor.name,
        avatarSrc,
        geminiVoice,
        minutesUsed: sub.tutor_minutes_used ?? 0,
        planType: sub.plan_type as PlanType,
      }} />
    </div>
  )
}
