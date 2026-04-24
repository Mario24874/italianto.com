import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType } from '@/lib/plans'
import { Music } from 'lucide-react'
import { CanzoniClient } from './_canzoni-client'
import type { SongRow } from './_canzoni-client'

export const metadata: Metadata = { title: 'Canzoni — Italianto' }

const PLAN_HIERARCHY: PlanType[] = ['free', 'essenziale', 'avanzato', 'maestro']

export default async function CanzoniPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = getSupabaseAdmin()
  const [songsResult, subResult] = await Promise.all([
    supabase.from('songs').select('id,slug,title,artist,lyrics,level,plan_required,audio_url,video_url').eq('status', 'published').order('order_index', { ascending: true }),
    supabase.from('subscriptions').select('plan_type').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
  ])

  const songs = (songsResult.data ?? []) as SongRow[]
  const userPlan = (subResult.data?.plan_type ?? 'free') as PlanType

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-verde-50 flex items-center gap-3">
          <Music size={28} className="text-pink-400" />
          Canzoni
        </h1>
        <p className="text-verde-500 mt-1 text-sm">Impara l&apos;italiano attraverso la musica italiana</p>
      </div>

      <CanzoniClient songs={songs} userPlan={userPlan} planHierarchy={PLAN_HIERARCHY} />
    </div>
  )
}
