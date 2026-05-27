'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Square, Volume2, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface ArticleNarratorProps {
  text: string
}

export function ArticleNarrator({ text }: ArticleNarratorProps) {
  const { t } = useLanguage()
  const ct = t.informazioni.narrator
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    function loadVoices() {
      const all = window.speechSynthesis.getVoices()
      const italian = all.filter(v => v.lang.startsWith('it'))
      setVoices(italian)
      if (italian.length > 0) setSelectedVoice(v => v || italian[0].name)
    }

    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback(() => {
    if (!text.trim() || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'it-IT'
    utterance.rate = speed

    const voice = voices.find(v => v.name === selectedVoice)
    if (voice) utterance.voice = voice

    utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false) }
    utterance.onend = () => { setIsSpeaking(false); setIsPaused(false) }
    utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false) }

    window.speechSynthesis.speak(utterance)
  }, [text, voices, selectedVoice, speed])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    setIsPaused(false)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }, [])

  if (!mounted) return null

  if (!('speechSynthesis' in window) || voices.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-verde-600 border border-verde-900/30 rounded-xl px-4 py-2.5 bg-verde-950/20">
        <AlertCircle size={14} />
        <span>{ct.noVoices}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-wrap border border-verde-900/30 rounded-xl px-4 py-3 bg-verde-950/20">
      <Volume2 size={15} className="text-verde-500 shrink-0" />

      {/* Play / Pause / Stop */}
      {!isSpeaking ? (
        <button
          onClick={speak}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-verde-700 hover:bg-verde-600 text-white font-semibold transition-colors"
        >
          <Play size={12} />
          {ct.listen}
        </button>
      ) : isPaused ? (
        <button
          onClick={resume}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-verde-700 hover:bg-verde-600 text-white font-semibold transition-colors"
        >
          <Play size={12} />
          {ct.resume}
        </button>
      ) : (
        <button
          onClick={pause}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-yellow-700/60 hover:bg-yellow-700 text-yellow-100 font-semibold transition-colors"
        >
          <Pause size={12} />
          {ct.pause}
        </button>
      )}

      {isSpeaking && (
        <button
          onClick={stop}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-verde-800/40 text-verde-500 hover:text-verde-200 transition-colors"
        >
          <Square size={12} />
          {ct.stop}
        </button>
      )}

      {/* Voice selector */}
      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-xs text-verde-600 shrink-0">{ct.voice}:</span>
        <select
          value={selectedVoice}
          onChange={e => setSelectedVoice(e.target.value)}
          className="text-xs rounded-lg bg-verde-950/50 border border-verde-800/30 text-verde-300 px-2 py-1 focus:outline-none max-w-[160px] truncate"
        >
          {voices.map(v => (
            <option key={v.name} value={v.name}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Speed */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-verde-600 shrink-0">{ct.speed}:</span>
        <input
          type="range" min="0.5" max="2" step="0.1"
          value={speed}
          onChange={e => setSpeed(parseFloat(e.target.value))}
          className="w-16 accent-verde-500"
        />
        <span className="text-xs text-verde-500 tabular-nums w-8">{speed.toFixed(1)}x</span>
      </div>
    </div>
  )
}
