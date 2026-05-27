'use client'

import { useRef, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Repeat, Minus, Maximize2, Music, FileMusic, FileVideo, Play } from 'lucide-react'
import { useMusicPlayer } from '@/contexts/music-player-context'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'

function isYoutube(url: string) {
  return /youtube\.com|youtu\.be/.test(url)
}

function getYoutubeEmbedUrl(url: string, autoplay = false) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
  if (!match) return null
  return `https://www.youtube.com/embed/${match[1]}?rel=0${autoplay ? '&autoplay=1' : ''}`
}

function EqualizerBars({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className="text-pink-400">
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

export function GlobalMusicPlayer() {
  const {
    currentSong, playlist, currentIndex, autoplay,
    modalOpen, isMinimized,
    closeSong, minimize, expand, next, prev, toggleAutoplay, audioRef,
  } = useMusicPlayer()
  const { t } = useLanguage()
  const ct = t.canzoni
  const videoRef = useRef<HTMLVideoElement>(null)

  const total = playlist.length

  const hasVideo = !!currentSong?.video_url
  const hasAudio = !!currentSong?.audio_url
  const isYT = hasVideo && isYoutube(currentSong!.video_url!)
  const ytEmbed = isYT ? getYoutubeEmbedUrl(currentSong!.video_url!, autoplay) : null

  const handleEnded = useCallback(() => {
    if (autoplay && currentIndex < total - 1) next()
  }, [autoplay, currentIndex, total, next])

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.addEventListener('ended', handleEnded)
    return () => vid.removeEventListener('ended', handleEnded)
  }, [handleEnded])

  // Auto-play native audio when song changes and autoplay is on
  useEffect(() => {
    if (!autoplay || !currentSong?.audio_url || currentSong.video_url) return
    audioRef.current?.play().catch(() => {})
  }, [currentSong?.id, autoplay, currentSong?.audio_url, currentSong?.video_url, audioRef])

  // Auto-play native video (non-YouTube) when song changes and autoplay is on
  useEffect(() => {
    if (!autoplay || !currentSong?.video_url || isYT) return
    videoRef.current?.play().catch(() => {})
  }, [currentSong?.id, autoplay, currentSong?.video_url, isYT])

  if (!currentSong) return null

  const showModal = modalOpen && !isMinimized
  const showMini = !showModal

  return (
    <>
      {/* ── Full modal — kept in DOM always so YouTube keeps playing ── */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4',
          !showModal && 'hidden'
        )}
        onClick={minimize}
      >
        <div
          className="w-full max-w-3xl bg-[#0a0f0a] border border-verde-800/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-verde-900/30 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={prev} disabled={currentIndex === 0}
                className="p-1.5 rounded-lg text-verde-600 hover:text-verde-300 hover:bg-verde-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                <ChevronLeft size={16} />
              </button>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-verde-100 leading-tight truncate">{currentSong.title}</h2>
                <p className="text-xs text-verde-500 mt-0.5">{currentSong.artist}</p>
              </div>
              <button onClick={next} disabled={currentIndex === total - 1}
                className="p-1.5 rounded-lg text-verde-600 hover:text-verde-300 hover:bg-verde-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-verde-700 tabular-nums mr-1">
                {currentIndex + 1} {ct.songOf} {total}
              </span>
              <button onClick={toggleAutoplay} title={ct.autoplay}
                className={cn('p-1.5 rounded-lg transition-colors',
                  autoplay ? 'text-pink-400 bg-pink-900/30 border border-pink-800/40' : 'text-verde-700 hover:text-verde-400 hover:bg-verde-900/30')}>
                <Repeat size={14} />
              </button>
              <button onClick={minimize}
                className="p-1.5 text-verde-600 hover:text-verde-300 transition-colors rounded-lg hover:bg-verde-900/30"
                title="Minimizar">
                <Minus size={16} />
              </button>
              <button onClick={closeSong}
                className="p-1.5 text-verde-600 hover:text-verde-200 transition-colors rounded-lg hover:bg-verde-900/30">
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
                      key={`${currentSong.id}-${autoplay}`}
                      src={ytEmbed}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : hasVideo && !isYT ? (
                  <video ref={videoRef} key={currentSong.id} src={currentSong.video_url!} controls className="w-full max-h-64 bg-black" />
                ) : hasAudio ? (
                  <div className="px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-pink-950/40 border border-pink-800/30 flex items-center justify-center shrink-0">
                      <FileMusic size={16} className="text-pink-400" />
                    </div>
                    <audio
                      ref={audioRef}
                      key={currentSong.id}
                      src={currentSong.audio_url!}
                      controls
                      className="flex-1 h-9"
                      onEnded={() => { if (autoplay) next() }}
                    />
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {currentSong.lyrics?.trim() ? (
                <>
                  <h3 className="text-xs font-semibold text-verde-500 uppercase tracking-widest mb-3">Testo</h3>
                  <pre className="text-verde-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">{currentSong.lyrics}</pre>
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

      {/* ── Mini-player — shown when not in full modal ── */}
      {showMini && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 bg-[#090e09]/95 border border-pink-900/40 backdrop-blur-md shadow-2xl rounded-2xl w-[min(480px,calc(100vw-96px))]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-pink-900/40 border border-pink-700/40 flex items-center justify-center shrink-0">
              {hasVideo ? <FileVideo size={14} className="text-pink-400" /> : <EqualizerBars size={16} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-verde-100 truncate leading-tight">{currentSong.title}</p>
              <p className="text-xs text-verde-500 truncate">{currentSong.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-verde-700 tabular-nums mr-1 hidden sm:block">
              {currentIndex + 1} {ct.songOf} {total}
            </span>
            <button onClick={prev} disabled={currentIndex === 0}
              className="p-1.5 rounded-lg text-verde-600 hover:text-verde-300 hover:bg-verde-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            <button onClick={next} disabled={currentIndex === total - 1}
              className="p-1.5 rounded-lg text-verde-600 hover:text-verde-300 hover:bg-verde-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
            <button onClick={toggleAutoplay} title={ct.autoplay}
              className={cn('p-1.5 rounded-lg transition-colors',
                autoplay ? 'text-pink-400 bg-pink-900/30 border border-pink-800/40' : 'text-verde-700 hover:text-verde-400 hover:bg-verde-900/30')}>
              <Repeat size={14} />
            </button>
            <button onClick={expand}
              className="p-1.5 text-verde-500 hover:text-verde-200 transition-colors rounded-lg hover:bg-verde-900/30"
              title="Expandir">
              <Maximize2 size={14} />
            </button>
            <button onClick={closeSong}
              className="p-1.5 text-verde-600 hover:text-red-400 transition-colors rounded-lg hover:bg-verde-900/30">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
