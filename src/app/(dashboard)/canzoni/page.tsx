import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType } from '@/lib/plans'
import Link from 'next/link'
import { Music, Lock, Play, ExternalLink } from 'lucide-react'

export const metadata: Metadata = { title: 'Canzoni — Italianto' }

const PLAN_HIERARCHY: PlanType[] = ['free', 'essenziale', 'avanzato', 'maestro']
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  A2: 'bg-green-900/50 text-green-300 border-green-700/40',
  B1: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  B2: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
  C1: 'bg-red-900/50 text-red-300 border-red-700/40',
  C2: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
}

function hasAccess(userPlan: PlanType, required: PlanType): boolean {
  return PLAN_HIERARCHY.indexOf(userPlan) >= PLAN_HIERARCHY.indexOf(required)
}

interface SongRow { id: string; slug: string; title: string; artist: string; level: string; plan_required: string; audio_url: string | null; video_url: string | null }

export default async function CanzoniPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = getSupabaseAdmin()
  const [songsResult, subResult] = await Promise.all([
    supabase.from('songs').select('id,slug,title,artist,level,plan_required,audio_url,video_url').eq('status', 'published').order('order_index', { ascending: true }),
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

      {songs.length === 0 ? (
        <div className="text-center py-20">
          <Music size={48} className="text-verde-800 mx-auto mb-4" />
          <p className="text-verde-500">Le canzoni arriveranno presto. Torna più tardi!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map(song => {
            const accessible = hasAccess(userPlan, song.plan_required as PlanType)
            const hasMedia = song.audio_url || song.video_url
            return accessible ? (
              <div key={song.id} className="flex items-center gap-4 p-4 rounded-2xl border border-verde-900/30 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-pink-950/40 border border-pink-800/30 flex items-center justify-center shrink-0">
                  <Music size={18} className="text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-verde-200 truncate">{song.title}</div>
                  <div className="text-xs text-verde-500 mt-0.5">{song.artist}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shrink-0 ${LEVEL_COLORS[song.level]}`}>{song.level}</span>
                {hasMedia && (
                  <a href={song.video_url ?? song.audio_url ?? '#'} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-pink-900/30 border border-pink-800/40 text-pink-300 hover:bg-pink-900/50 transition-colors">
                    {song.video_url ? <ExternalLink size={12} /> : <Play size={12} />}
                    {song.video_url ? 'Ver' : 'Escuchar'}
                  </a>
                )}
              </div>
            ) : (
              <div key={song.id} className="flex items-center gap-4 p-4 rounded-2xl border border-verde-900/20 bg-verde-950/10 opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 rounded-xl bg-verde-900/20 flex items-center justify-center shrink-0">
                  <Lock size={16} className="text-verde-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-verde-500 truncate">{song.title}</div>
                  <div className="text-xs text-verde-700 mt-0.5">{song.artist}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shrink-0 ${LEVEL_COLORS[song.level]}`}>{song.level}</span>
                <Link href="/impostazioni" onClick={e => e.stopPropagation()} className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-verde-800/40 text-verde-500 hover:text-verde-300 hover:border-verde-600 transition-colors">
                  Upgrade
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
