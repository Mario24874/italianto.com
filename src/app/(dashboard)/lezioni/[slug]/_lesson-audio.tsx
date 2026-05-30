'use client'

import { useState } from 'react'
import { Headphones, Play, Pause } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import type { AudioClip } from '@/types'

export function LessonAudio({ clips }: { clips: AudioClip[] }) {
  const { t } = useLanguage()
  const [playing, setPlaying] = useState<string | null>(null)

  if (!clips || clips.length === 0) return null

  const handlePlay = (clipId: string, audioEl: HTMLAudioElement) => {
    if (playing === clipId) {
      audioEl.pause()
      setPlaying(null)
    } else {
      document.querySelectorAll('audio[data-clip]').forEach(el => {
        (el as HTMLAudioElement).pause()
      })
      audioEl.play()
      setPlaying(clipId)
      audioEl.onended = () => setPlaying(null)
    }
  }

  // Group clips by section. Clips without a section go under a default group.
  const sections: { label: string | null; clips: AudioClip[] }[] = []
  for (const clip of clips) {
    const sec = clip.section?.trim() || null
    const existing = sections.find(s => s.label === sec)
    if (existing) {
      existing.clips.push(clip)
    } else {
      sections.push({ label: sec, clips: [clip] })
    }
  }

  const ClipRow = ({ clip }: { clip: AudioClip }) => (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200/60 dark:border-amber-800/20 bg-white/60 dark:bg-amber-950/20 px-4 py-3">
      <button
        onClick={e => {
          const audioEl = e.currentTarget.parentElement?.querySelector('audio') as HTMLAudioElement
          if (audioEl) handlePlay(clip.id, audioEl)
        }}
        className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          playing === clip.id
            ? 'bg-amber-500 text-white'
            : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50'
        }`}
      >
        {playing === clip.id
          ? <Pause size={14} />
          : <Play size={14} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-amber-900 dark:text-amber-200 truncate">{clip.title}</div>
        {clip.description && (
          <div className="text-xs text-amber-700 dark:text-amber-600 truncate">{clip.description}</div>
        )}
      </div>
      <audio data-clip={clip.id} src={clip.url} preload="none" className="hidden" />
    </div>
  )

  return (
    <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/30 bg-amber-50/60 dark:bg-amber-950/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Headphones size={16} className="text-amber-600 dark:text-amber-400" />
        <h2 className="font-semibold text-amber-800 dark:text-amber-300 text-sm uppercase tracking-wide">
          {t.lessons.audioSection}
        </h2>
      </div>

      {sections.length === 1 && sections[0].label === null ? (
        // No sections — flat grid layout
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections[0].clips.map(clip => <ClipRow key={clip.id} clip={clip} />)}
        </div>
      ) : (
        // Multiple sections — show section headers
        <div className="space-y-5">
          {sections.map((sec, i) => (
            <div key={i}>
              {sec.label && (
                <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wide mb-2">
                  {sec.label}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sec.clips.map(clip => <ClipRow key={clip.id} clip={clip} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
