'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Music, Lock, Play, X, FileMusic, FileVideo } from 'lucide-react'
import type { PlanType } from '@/lib/plans'

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  A2: 'bg-green-900/50 text-green-300 border-green-700/40',
  B1: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  B2: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
  C1: 'bg-red-900/50 text-red-300 border-red-700/40',
  C2: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
}

export interface SongRow {
  id: string
  slug: string
  title: string
  artist: string
  lyrics: string | null
  level: string
  plan_required: string
  audio_url: string | null
  video_url: string | null
}

function isYoutube(url: string) {
  return /youtube\.com|youtu\.be/.test(url)
}

function getYoutubeEmbedUrl(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null
}

function SongModal({ song, onClose }: { song: SongRow; onClose: () => void }) {
  const hasVideo = !!song.video_url
  const hasAudio = !!song.audio_url
  const isYT = hasVideo && isYoutube(song.video_url!)
  const ytEmbed = isYT ? getYoutubeEmbedUrl(song.video_url!) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#0a0f0a] border border-verde-800/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-verde-900/30 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-verde-100 leading-tight">{song.title}</h2>
            <p className="text-xs text-verde-500 mt-0.5">{song.artist}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-verde-600 hover:text-verde-200 transition-colors rounded-lg hover:bg-verde-900/30"
          >
            <X size={18} />
          </button>
        </div>

        {/* Media + Lyrics */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Player */}
          {(hasVideo || hasAudio) && (
            <div className="shrink-0 bg-black/40 border-b border-verde-900/30">
              {hasVideo && isYT && ytEmbed ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={ytEmbed}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : hasVideo && !isYT ? (
                <video
                  src={song.video_url!}
                  controls
                  className="w-full max-h-64 bg-black"
                />
              ) : hasAudio ? (
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pink-950/40 border border-pink-800/30 flex items-center justify-center shrink-0">
                    <FileMusic size={16} className="text-pink-400" />
                  </div>
                  <audio src={song.audio_url!} controls className="flex-1 h-9" />
                </div>
              ) : null}
            </div>
          )}

          {/* Lyrics */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {song.lyrics?.trim() ? (
              <>
                <h3 className="text-xs font-semibold text-verde-500 uppercase tracking-widest mb-3">Testo</h3>
                <pre className="text-verde-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {song.lyrics}
                </pre>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-verde-700">
                <FileMusic size={28} className="mb-2" />
                <p className="text-sm">Testo non disponibile</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CanzoniClient({
  songs,
  userPlan,
  planHierarchy,
}: {
  songs: SongRow[]
  userPlan: PlanType
  planHierarchy: PlanType[]
}) {
  const [selected, setSelected] = useState<SongRow | null>(null)

  function hasAccess(required: string) {
    return planHierarchy.indexOf(userPlan) >= planHierarchy.indexOf(required as PlanType)
  }

  return (
    <>
      {songs.length === 0 ? (
        <div className="text-center py-20">
          <Music size={48} className="text-verde-800 mx-auto mb-4" />
          <p className="text-verde-500">Le canzoni arriveranno presto. Torna più tardi!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map(song => {
            const accessible = hasAccess(song.plan_required)
            const hasMedia = song.audio_url || song.video_url
            const hasContent = hasMedia || song.lyrics?.trim()

            return accessible ? (
              <div
                key={song.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-verde-900/30 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-950/40 border border-pink-800/30 flex items-center justify-center shrink-0">
                  <Music size={18} className="text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-verde-200 truncate">{song.title}</div>
                  <div className="text-xs text-verde-500 mt-0.5">{song.artist}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shrink-0 ${LEVEL_COLORS[song.level]}`}>
                  {song.level}
                </span>
                {hasContent && (
                  <button
                    onClick={() => setSelected(song)}
                    className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-pink-900/30 border border-pink-800/40 text-pink-300 hover:bg-pink-900/50 transition-colors"
                  >
                    {song.video_url ? <FileVideo size={12} /> : song.audio_url ? <Play size={12} /> : <FileMusic size={12} />}
                    {song.video_url ? 'Ver' : song.audio_url ? 'Escuchar' : 'Ver letra'}
                  </button>
                )}
              </div>
            ) : (
              <div
                key={song.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-verde-900/20 bg-verde-950/10 opacity-60 cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl bg-verde-900/20 flex items-center justify-center shrink-0">
                  <Lock size={16} className="text-verde-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-verde-500 truncate">{song.title}</div>
                  <div className="text-xs text-verde-700 mt-0.5">{song.artist}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shrink-0 ${LEVEL_COLORS[song.level]}`}>
                  {song.level}
                </span>
                <Link
                  href="/impostazioni"
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-verde-800/40 text-verde-500 hover:text-verde-300 hover:border-verde-600 transition-colors"
                >
                  Upgrade
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {selected && <SongModal song={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
