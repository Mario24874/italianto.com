'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Music, Play, X, FileMusic, FileVideo, Search, ChevronLeft, ChevronRight, Repeat } from 'lucide-react'

function EqualizerBars() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-pink-400">
      <rect x="1" y="9" width="3" height="9" rx="1" fill="currentColor">
        <animate attributeName="height" values="9;15;4;13;6;9" dur="1.1s" repeatCount="indefinite" />
        <animate attributeName="y" values="9;3;14;5;12;9" dur="1.1s" repeatCount="indefinite" />
      </rect>
      <rect x="7" y="5" width="3" height="13" rx="1" fill="currentColor">
        <animate attributeName="height" values="13;5;15;4;11;13" dur="0.85s" repeatCount="indefinite" />
        <animate attributeName="y" values="5;13;3;14;7;5" dur="0.85s" repeatCount="indefinite" />
      </rect>
      <rect x="13" y="7" width="3" height="11" rx="1" fill="currentColor">
        <animate attributeName="height" values="11;15;5;13;8;11" dur="1.35s" repeatCount="indefinite" />
        <animate attributeName="y" values="7;3;13;5;10;7" dur="1.35s" repeatCount="indefinite" />
      </rect>
    </svg>
  )
}
import type { PlanType } from '@/lib/plans'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'

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

function getYoutubeEmbedUrl(url: string, autoplay = false) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
  if (!match) return null
  return `https://www.youtube.com/embed/${match[1]}?rel=0${autoplay ? '&autoplay=1' : ''}`
}

function SongModal({
  song,
  index,
  total,
  autoplay,
  onPrev,
  onNext,
  onClose,
  onToggleAutoplay,
}: {
  song: SongRow
  index: number
  total: number
  autoplay: boolean
  onPrev: () => void
  onNext: () => void
  onClose: () => void
  onToggleAutoplay: () => void
}) {
  const { t } = useLanguage()
  const ct = t.canzoni
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const hasVideo = !!song.video_url
  const hasAudio = !!song.audio_url
  const isYT = hasVideo && isYoutube(song.video_url!)
  const ytEmbed = isYT ? getYoutubeEmbedUrl(song.video_url!, autoplay) : null

  // Auto-advance for native audio/video
  const handleEnded = useCallback(() => {
    if (autoplay && index < total - 1) onNext()
  }, [autoplay, index, total, onNext])

  useEffect(() => {
    const audio = audioRef.current
    const video = videoRef.current
    if (audio) { audio.addEventListener('ended', handleEnded); return () => audio.removeEventListener('ended', handleEnded) }
    if (video) { video.addEventListener('ended', handleEnded); return () => video.removeEventListener('ended', handleEnded) }
  }, [handleEnded])

  // Auto-play native media when song changes
  useEffect(() => {
    if (!autoplay) return
    audioRef.current?.play().catch(() => {})
    videoRef.current?.play().catch(() => {})
  }, [song.id, autoplay])

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
          <div className="flex items-center gap-3 min-w-0">
            {/* Prev */}
            <button
              onClick={onPrev}
              disabled={index === 0}
              className="p-1.5 rounded-lg text-verde-600 hover:text-verde-300 hover:bg-verde-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-verde-100 leading-tight truncate">{song.title}</h2>
              <p className="text-xs text-verde-500 mt-0.5">{song.artist}</p>
            </div>

            {/* Next */}
            <button
              onClick={onNext}
              disabled={index === total - 1}
              className="p-1.5 rounded-lg text-verde-600 hover:text-verde-300 hover:bg-verde-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Counter */}
            <span className="text-xs text-verde-700 tabular-nums">{index + 1} {ct.songOf} {total}</span>

            {/* Autoplay toggle */}
            <button
              onClick={onToggleAutoplay}
              title={ct.autoplay}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                autoplay
                  ? 'text-pink-400 bg-pink-900/30 border border-pink-800/40'
                  : 'text-verde-700 hover:text-verde-400 hover:bg-verde-900/30'
              )}
            >
              <Repeat size={14} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-verde-600 hover:text-verde-200 transition-colors rounded-lg hover:bg-verde-900/30"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Media + Lyrics */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {(hasVideo || hasAudio) && (
            <div className="shrink-0 bg-black/40 border-b border-verde-900/30">
              {hasVideo && isYT && ytEmbed ? (
                <div className="aspect-video w-full">
                  <iframe
                    key={`${song.id}-${autoplay}`}
                    src={ytEmbed}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : hasVideo && !isYT ? (
                <video
                  ref={videoRef}
                  key={song.id}
                  src={song.video_url!}
                  controls
                  className="w-full max-h-64 bg-black"
                />
              ) : hasAudio ? (
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pink-950/40 border border-pink-800/30 flex items-center justify-center shrink-0">
                    <FileMusic size={16} className="text-pink-400" />
                  </div>
                  <audio
                    ref={audioRef}
                    key={song.id}
                    src={song.audio_url!}
                    controls
                    className="flex-1 h-9"
                  />
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
  const { t } = useLanguage()
  const ct = t.canzoni
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [autoplay, setAutoplay] = useState(false)

  function hasAccess(required: string) {
    return planHierarchy.indexOf(userPlan) >= planHierarchy.indexOf(required as PlanType)
  }

  const accessible = songs.filter(s => hasAccess(s.plan_required))

  const filtered = search.trim()
    ? accessible.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase())
      )
    : accessible

  const selected = selectedIndex !== null ? filtered[selectedIndex] ?? null : null

  function open(idx: number) { setSelectedIndex(idx) }
  function close() { setSelectedIndex(null) }
  function prev() { if (selectedIndex !== null && selectedIndex > 0) setSelectedIndex(selectedIndex - 1) }
  function next() { if (selectedIndex !== null && selectedIndex < filtered.length - 1) setSelectedIndex(selectedIndex + 1) }

  if (songs.length === 0) {
    return (
      <div className="text-center py-20">
        <Music size={48} className="text-verde-800 mx-auto mb-4" />
        <p className="text-verde-500">{ct.emptyState}</p>
      </div>
    )
  }

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-verde-600 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setSelectedIndex(null) }}
          placeholder={ct.searchPlaceholder}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-verde-950/40 border border-verde-800/30 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-verde-600 hover:text-verde-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search size={32} className="text-verde-800 mx-auto mb-3" />
          <p className="text-verde-500 text-sm">{ct.noResults}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((song, idx) => {
            const hasContent = song.audio_url || song.video_url || song.lyrics?.trim()
            const isPlaying = selectedIndex === idx
            return (
              <div
                key={song.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl border transition-all',
                  isPlaying
                    ? 'border-pink-700/50 bg-pink-950/20'
                    : 'border-verde-900/30 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0',
                  isPlaying ? 'bg-pink-900/40 border-pink-700/40' : 'bg-pink-950/40 border-pink-800/30'
                )}>
                  {isPlaying ? <EqualizerBars /> : <Music size={18} className="text-pink-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-verde-200 truncate">{song.title}</div>
                  <div className="text-xs text-verde-500 mt-0.5">{song.artist}</div>
                </div>
                {hasContent && (
                  <button
                    onClick={() => open(idx)}
                    className={cn(
                      'shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
                      isPlaying
                        ? 'bg-pink-800/40 border-pink-700/50 text-pink-200'
                        : 'bg-pink-900/30 border-pink-800/40 text-pink-300 hover:bg-pink-900/50'
                    )}
                  >
                    {song.video_url ? <FileVideo size={12} /> : song.audio_url ? <Play size={12} /> : <FileMusic size={12} />}
                    {song.video_url ? ct.watch : song.audio_url ? ct.listen : ct.lyrics}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selected && selectedIndex !== null && (
        <SongModal
          song={selected}
          index={selectedIndex}
          total={filtered.length}
          autoplay={autoplay}
          onPrev={prev}
          onNext={next}
          onClose={close}
          onToggleAutoplay={() => setAutoplay(a => !a)}
        />
      )}
    </>
  )
}
