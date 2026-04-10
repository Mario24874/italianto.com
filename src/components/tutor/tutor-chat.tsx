'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, PhoneOff, Settings, Volume2, VolumeX, Bot, AlertCircle, ArrowLeft, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLANS } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'

// ── Avatar + voice catalog ────────────────────────────────────────────────────
const AVATAR_OPTIONS = [
  {
    id: 'marco', name: 'Marco', gender: 'male' as const, src: '/tutor-Marco.png',
    voices: [
      { id: 'JBFqnCBsd6RMkjVDRZzb', label: 'George' },
      { id: 'IKne3meq5aSn9XLyUdCD', label: 'Charlie' },
    ],
  },
  {
    id: 'giovanni', name: 'Giovanni', gender: 'male' as const, src: '/tutor-Giovanni.png',
    voices: [
      { id: 'JBFqnCBsd6RMkjVDRZzb', label: 'George' },
      { id: 'IKne3meq5aSn9XLyUdCD', label: 'Charlie' },
    ],
  },
  {
    id: 'giulia', name: 'Giulia', gender: 'female' as const, src: '/tutor-Giulia.png',
    voices: [
      { id: 'Xb7hH8MSUJpSbSDYk0k2', label: 'Alice' },
      { id: 'XrExE9yKIg1WjnnlVkGX', label: 'Matilda' },
    ],
  },
  {
    id: 'francesca', name: 'Francesca', gender: 'female' as const, src: '/tutor-Francesca.png',
    voices: [
      { id: 'Xb7hH8MSUJpSbSDYk0k2', label: 'Alice' },
      { id: 'XrExE9yKIg1WjnnlVkGX', label: 'Matilda' },
    ],
  },
]

// ── Types ────────────────────────────────────────────────────────────────────
type CallStatus = 'idle' | 'listening' | 'thinking' | 'speaking'
type AvatarId = 'marco' | 'giovanni' | 'giulia' | 'francesca'

interface Message { role: 'user' | 'assistant'; content: string }

interface TutorPrefs {
  // Personalization
  avatarId: AvatarId
  customName: string
  voiceId: string
  // Session prefs
  registro: 'informale' | 'formale'
  tono: 'amichevole' | 'professionale' | 'incoraggiante'
  focus: 'conversazione' | 'grammatica' | 'vocabolario' | 'pronuncia'
  modismi: 'neutro' | 'roma' | 'milano' | 'napoli'
  livello: 'A1' | 'A2' | 'B1'
}

const DEFAULT_PREFS: TutorPrefs = {
  avatarId: 'marco',
  customName: 'Marco',
  voiceId: 'JBFqnCBsd6RMkjVDRZzb',
  registro: 'informale',
  tono: 'amichevole',
  focus: 'conversazione',
  modismi: 'neutro',
  livello: 'A1',
}

const PREFS_KEY = 'tutor_prefs_v1'

interface TutorChatProps {
  tutorName: string
  tutorSlug: string
  avatarUrl: string | null
  voiceId: string | null
  gender?: 'male' | 'female' | 'neutral'
  minutesUsed: number
  planType: PlanType
}

// ── Equalizer bars ────────────────────────────────────────────────────────────
function EqualizerBars({ active, color }: { active: boolean; color: string }) {
  if (!active) {
    return (
      <div className="flex items-end gap-[3px] h-7">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1 rounded-sm h-1" style={{ backgroundColor: color, opacity: 0.3 }} />
        ))}
      </div>
    )
  }
  return (
    <div className="flex items-end gap-[3px] h-7">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="eq-bar w-1 rounded-sm"
          style={{ backgroundColor: color, height: '100%', animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}

// ── Radio group ───────────────────────────────────────────────────────────────
function RadioGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-verde-400 uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              value === opt.value
                ? 'bg-verde-700/60 border-verde-600 text-verde-100'
                : 'bg-verde-950/30 border-verde-900/40 text-verde-500 hover:text-verde-300 hover:border-verde-700/50',
            )}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function TutorChat({
  tutorName, tutorSlug, avatarUrl: _avatarUrl, voiceId: _voiceId,
  gender: _gender = 'neutral', minutesUsed, planType,
}: TutorChatProps) {
  const router = useRouter()
  const [status, setStatus]             = useState<CallStatus>('idle')
  const [messages, setMessages]         = useState<Message[]>([])
  const [ttsEnabled, setTtsEnabled]     = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [prefs, setPrefs]               = useState<TutorPrefs>({
    ...DEFAULT_PREFS, customName: tutorName,
  })
  const [nameInput, setNameInput]       = useState(tutorName)
  const [error, setError]               = useState<string | null>(null)
  const [userVolume, setUserVolume]     = useState(0)
  const [localMinutes, setLocalMinutes] = useState(minutesUsed)

  const messagesRef  = useRef<Message[]>([])
  const scrollRef    = useRef<HTMLDivElement>(null)
  const recogRef     = useRef<{ stop: () => void } | null>(null)
  const audioRef     = useRef<HTMLAudioElement | null>(null)
  const utterRef     = useRef<SpeechSynthesisUtterance | null>(null)
  const micPollRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef  = useRef<AudioContext | null>(null)

  // Derived effective values from prefs
  const avatarOption  = AVATAR_OPTIONS.find(a => a.id === prefs.avatarId) ?? AVATAR_OPTIONS[0]
  const effectiveName   = prefs.customName || tutorName
  const effectiveAvatar = avatarOption.src
  const effectiveVoice  = prefs.voiceId
  const effectiveGender = avatarOption.gender

  const plan        = PLANS.find(p => p.id === planType)
  const minuteLimit = plan?.limits.tutorMinutes ?? null
  const minutesLeft = minuteLimit !== null ? Math.max(0, minuteLimit - Math.floor(localMinutes)) : null

  // Load saved prefs
  useEffect(() => {
    try {
      const s = localStorage.getItem(PREFS_KEY)
      if (s) {
        const loaded = { ...DEFAULT_PREFS, customName: tutorName, ...JSON.parse(s) }
        setPrefs(loaded)
        setNameInput(loaded.customName)
      }
    } catch {}
  }, [tutorName])

  const savePrefs = useCallback((next: TutorPrefs) => {
    setPrefs(next)
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)) } catch {}
  }, [])

  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // ── Audio controls ─────────────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    audioRef.current?.pause(); audioRef.current = null
    window.speechSynthesis?.cancel(); utterRef.current = null
  }, [])

  const startMicAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      audioCtxRef.current = ctx
      const data = new Uint8Array(analyser.frequencyBinCount)
      micPollRef.current = setInterval(() => {
        analyser.getByteFrequencyData(data)
        setUserVolume(Math.min(1, data.reduce((a, b) => a + b, 0) / data.length / 40))
      }, 80)
    } catch {
      setError('Permesso microfono negato.')
    }
  }, [])

  const stopMicAnalysis = useCallback(() => {
    if (micPollRef.current) clearInterval(micPollRef.current)
    audioCtxRef.current?.close(); audioCtxRef.current = null
    micStreamRef.current?.getTracks().forEach(t => t.stop()); micStreamRef.current = null
    setUserVolume(0)
  }, [])

  // ── Web Speech voice resolution ────────────────────────────────────────────
  const resolveVoice = useCallback((): SpeechSynthesisVoice | null => {
    const all = window.speechSynthesis.getVoices()
    const italian = all.filter(v => v.lang.startsWith('it'))
    if (italian.length === 0) return null
    const MALE   = /cosimo|luca|giorgio|marco|antonio|roberto|david/i
    const FEMALE = /elsa|alice|francesca|giulia|federica|paola|google italiano/i
    if (effectiveGender === 'male')
      return italian.find(v => MALE.test(v.name)) ?? italian.find(v => !FEMALE.test(v.name)) ?? italian[italian.length - 1]
    return italian.find(v => FEMALE.test(v.name)) ?? italian[0]
  }, [effectiveGender])

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    if (!ttsEnabled) return
    stopAudio(); setStatus('speaking')

    if (effectiveVoice) {
      try {
        const res = await fetch('/api/tutor/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice_id: effectiveVoice }),
        })
        if (res.ok) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio
          audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; setStatus('idle') }
          audio.onerror = () => setStatus('idle')
          await audio.play(); return
        }
      } catch { /* fall through */ }
    }

    if (!window.speechSynthesis) { setStatus('idle'); return }
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'it-IT'; utter.rate = 0.9
    utter.pitch = effectiveGender === 'male' ? 0.8 : 1.1
    const setVoice = () => { const v = resolveVoice(); if (v) utter.voice = v }
    if (window.speechSynthesis.getVoices().length > 0) setVoice()
    else window.speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true })
    utter.onend = () => { utterRef.current = null; setStatus('idle') }
    utter.onerror = () => { utterRef.current = null; setStatus('idle') }
    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [ttsEnabled, effectiveVoice, effectiveGender, stopAudio, resolveVoice])

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim(); if (!trimmed) return
    const userMsg: Message = { role: 'user', content: trimmed }
    const next = [...messagesRef.current, userMsg]
    setMessages(next); setStatus('thinking'); setError(null)
    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, tutorName: effectiveName, tutorSlug, prefs }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Errore del tutor'); setStatus('idle'); return }
      const assistantMsg: Message = { role: 'assistant', content: data.text }
      setMessages(prev => [...prev, assistantMsg])
      setLocalMinutes(prev => prev + 0.1)
      await speak(data.text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore di rete'); setStatus('idle')
    }
  }, [effectiveName, tutorSlug, prefs, speak])

  // ── Speech recognition ─────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Riconoscimento vocale non supportato. Usa Chrome o Edge.'); return }
    stopAudio(); await startMicAnalysis()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any
    rec.lang = 'it-IT'; rec.continuous = false; rec.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => { stopMicAnalysis(); sendMessage(e.results[0][0].transcript) }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      stopMicAnalysis(); setStatus('idle')
      const msgs: Record<string, string> = {
        'not-allowed': 'Accesso microfono negato.',
        'no-speech': 'Nessuna voce rilevata. Riprova.',
        'network': 'Errore di rete nel riconoscimento vocale.',
      }
      if (msgs[e.error]) setError(msgs[e.error])
    }
    rec.onend = () => { stopMicAnalysis(); setStatus(s => s === 'listening' ? 'idle' : s) }
    recogRef.current = rec; rec.start(); setStatus('listening'); setError(null)
  }, [stopAudio, startMicAnalysis, stopMicAnalysis, sendMessage])

  const stopListening = useCallback(() => {
    recogRef.current?.stop(); stopMicAnalysis(); setStatus('idle')
  }, [stopMicAnalysis])

  // ── Greeting on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    const greeting = `Ciao! Sono ${effectiveName}, il tuo tutor di italiano. Come stai oggi?`
    setMessages([{ role: 'assistant', content: greeting }])
    setTimeout(() => speak(greeting), 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => {
    stopAudio(); stopMicAnalysis(); recogRef.current?.stop()
  }, [stopAudio, stopMicAnalysis])

  const isSpeaking  = status === 'speaking'
  const isListening = status === 'listening'
  const isThinking  = status === 'thinking'
  const isActive    = status !== 'idle'

  // ── Settings panel ─────────────────────────────────────────────────────────
  if (showSettings) {
    return (
      <div className="flex flex-col h-full bg-bg-dark">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-verde-900/30 shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-verde-400" />
            <span className="font-bold text-verde-100 text-sm">Personalizza il tutor</span>
          </div>
          <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-verde-500 hover:text-verde-300">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

          {/* ── Avatar selector ── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-verde-400 uppercase tracking-wide">Avatar del tutor</p>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_OPTIONS.map(av => (
                <button
                  key={av.id}
                  onClick={() => {
                    const next = {
                      ...prefs,
                      avatarId: av.id as AvatarId,
                      voiceId: av.voices[0].id,
                    }
                    savePrefs(next)
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all',
                    prefs.avatarId === av.id
                      ? 'border-verde-500 bg-verde-900/30 ring-1 ring-verde-500/40'
                      : 'border-verde-900/40 hover:border-verde-700/50',
                  )}
                >
                  <div className="relative size-14 rounded-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={av.src} alt={av.name} className="size-full object-cover" />
                    {prefs.avatarId === av.id && (
                      <div className="absolute inset-0 bg-verde-500/20 flex items-center justify-center">
                        <Check size={16} className="text-verde-300" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-verde-400 font-medium">{av.name}</span>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full',
                    av.gender === 'male'
                      ? 'bg-blue-900/40 text-blue-300'
                      : 'bg-pink-900/40 text-pink-300',
                  )}>
                    {av.gender === 'male' ? '♂ Uomo' : '♀ Donna'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Custom name ── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-verde-400 uppercase tracking-wide">Nombre del tutor</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder={avatarOption.name}
                maxLength={24}
                className="flex-1 bg-verde-950/40 border border-verde-900/40 rounded-xl px-4 py-2.5 text-sm text-verde-100
                  placeholder:text-verde-700 focus:outline-none focus:ring-1 focus:ring-verde-700"
              />
              <button
                onClick={() => savePrefs({ ...prefs, customName: nameInput.trim() || avatarOption.name })}
                className="px-3 py-2 bg-verde-700 hover:bg-verde-600 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                OK
              </button>
            </div>
          </div>

          {/* ── Voice selector ── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-verde-400 uppercase tracking-wide">Voz (ElevenLabs)</p>
            <div className="flex gap-2">
              {avatarOption.voices.map(v => (
                <button
                  key={v.id}
                  onClick={() => savePrefs({ ...prefs, voiceId: v.id })}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors',
                    prefs.voiceId === v.id
                      ? 'bg-verde-700/60 border-verde-600 text-verde-100'
                      : 'bg-verde-950/30 border-verde-900/40 text-verde-500 hover:text-verde-300 hover:border-verde-700/50',
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-verde-700">
              Requiere ELEVENLABS_API_KEY. Sin clave usa Web Speech API.
            </p>
          </div>

          <div className="border-t border-verde-900/30 pt-4 space-y-5">
            <p className="text-xs font-semibold text-verde-400 uppercase tracking-wide">Preferenze sessione</p>

            <RadioGroup label="Registro" value={prefs.registro} onChange={v => savePrefs({ ...prefs, registro: v })}
              options={[{ value: 'informale', label: 'Informale (tu)' }, { value: 'formale', label: 'Formale (Lei)' }]} />

            <RadioGroup label="Tono" value={prefs.tono} onChange={v => savePrefs({ ...prefs, tono: v })}
              options={[{ value: 'amichevole', label: 'Amichevole' }, { value: 'professionale', label: 'Professionale' }, { value: 'incoraggiante', label: 'Incoraggiante' }]} />

            <RadioGroup label="Focus" value={prefs.focus} onChange={v => savePrefs({ ...prefs, focus: v })}
              options={[{ value: 'conversazione', label: 'Conversazione' }, { value: 'grammatica', label: 'Grammatica' }, { value: 'vocabolario', label: 'Vocabolario' }, { value: 'pronuncia', label: 'Pronuncia' }]} />

            <RadioGroup label="Modismi" value={prefs.modismi} onChange={v => savePrefs({ ...prefs, modismi: v })}
              options={[{ value: 'neutro', label: 'Neutro' }, { value: 'roma', label: 'Romano' }, { value: 'milano', label: 'Milanese' }, { value: 'napoli', label: 'Napoletano' }]} />

            <RadioGroup label="Il tuo livello" value={prefs.livello} onChange={v => savePrefs({ ...prefs, livello: v })}
              options={[{ value: 'A1', label: 'A1 — Principiante' }, { value: 'A2', label: 'A2 — Base' }, { value: 'B1', label: 'B1 — Intermedio' }]} />
          </div>
        </div>

        <div className="px-4 pb-5 pt-2 border-t border-verde-900/30 shrink-0">
          <button
            onClick={() => setShowSettings(false)}
            className="w-full py-3 bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Salva e torna alla conversazione
          </button>
        </div>
      </div>
    )
  }

  // ── Main call UI ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-bg-dark">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-verde-900/30 shrink-0 bg-bg-dark/80 backdrop-blur">
        <button
          onClick={() => { stopAudio(); router.push('/tutor') }}
          className="p-2 rounded-xl text-verde-500 hover:text-verde-300 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-bold text-verde-100 text-sm">{effectiveName}</p>
          <p className="text-xs text-verde-500 capitalize">{prefs.tono} · {prefs.livello}</p>
        </div>
        <div className="flex items-center gap-1">
          {minutesLeft !== null && (
            <div className="text-right mr-1">
              <p className={cn('font-bold text-sm leading-tight', minutesLeft === 0 ? 'text-red-400' : 'text-verde-300')}>
                {minutesLeft}<span className="text-verde-600 font-normal text-xs">/{minuteLimit}</span>
              </p>
              <p className="text-[10px] text-verde-600">min</p>
            </div>
          )}
          <button
            onClick={() => { stopAudio(); setTtsEnabled(v => !v) }}
            className={cn('p-2 rounded-xl transition-colors', ttsEnabled ? 'text-verde-400' : 'text-verde-700')}
          >
            {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl text-verde-500 hover:text-verde-300 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* ── Tutor card ── */}
      <div className="flex flex-col items-center pt-6 pb-4 shrink-0">
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={isSpeaking ? { repeat: Infinity, duration: 1.2 } : {}}
          className={cn(
            'size-28 rounded-full overflow-hidden ring-4 shadow-green transition-all',
            isSpeaking ? 'ring-verde-500' : 'ring-verde-900/60',
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={effectiveAvatar} alt={effectiveName} className="size-full object-cover"
            onError={e => {
              const el = e.target as HTMLImageElement
              el.style.display = 'none'
              const parent = el.parentElement
              if (parent) {
                parent.style.background = '#1a3a1a'
                parent.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4a7a4a" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>`
              }
            }}
          />
        </motion.div>

        <h2 className="mt-4 text-xl font-bold text-verde-100">{effectiveName}</h2>

        <AnimatePresence mode="wait">
          <motion.p key={status} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn('mt-1 text-xs font-medium', {
              'text-verde-700': status === 'idle',
              'text-red-400': isListening,
              'text-amber-400': isThinking,
              'text-verde-400': isSpeaking,
            })}>
            {status === 'idle' && 'Premi il microfono per parlare'}
            {isListening && '🎙 Sto ascoltando...'}
            {isThinking && '💭 Sto pensando...'}
            {isSpeaking && `${effectiveName} sta parlando...`}
          </motion.p>
        </AnimatePresence>

        {/* Equalizer */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex flex-col items-center gap-1">
            <EqualizerBars active={isSpeaking} color="#4caf50" />
            <span className="text-[10px] text-verde-700">{effectiveName}</span>
          </div>
          <div className="w-px h-6 bg-verde-900/40" />
          <div className="flex flex-col items-center gap-1">
            <EqualizerBars active={isListening && userVolume > 0.1} color="#2196f3" />
            <span className="text-[10px] text-verde-700">Tu</span>
          </div>
        </div>
      </div>

      {/* ── Transcript ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-2 py-2">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-verde-700 text-white rounded-br-sm'
                : 'bg-verde-950/60 border border-verde-900/40 text-verde-100 rounded-bl-sm',
            )}>
              {msg.content}
            </div>
          </motion.div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-verde-950/60 border border-verde-900/40 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              {[0, 0.15, 0.3].map((d, i) => (
                <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }}
                  className="size-1.5 bg-verde-500 rounded-full" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 bg-red-950/30 border border-red-800/40 rounded-xl text-red-400 text-xs">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Mic controls ── */}
      <div className="flex justify-center items-center gap-6 px-8 pb-6 pt-3 shrink-0">
        {isActive && (
          <button
            onClick={() => { stopAudio(); stopListening(); setStatus('idle') }}
            className="size-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg"
          >
            <PhoneOff size={20} />
          </button>
        )}

        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={isListening ? stopListening : startListening}
          disabled={isThinking || isSpeaking}
          className={cn(
            'size-20 rounded-full flex items-center justify-center transition-colors',
            isListening
              ? 'bg-red-600 text-white ring-4 ring-red-400/40'
              : isThinking || isSpeaking
              ? 'bg-verde-950/40 text-verde-700 cursor-not-allowed'
              : 'bg-verde-700 hover:bg-verde-600 text-white shadow-green',
          )}
        >
          {isListening ? <MicOff size={32} /> : <Mic size={32} />}
        </motion.button>

        {isActive && <div className="size-12" />}
      </div>
    </div>
  )
}
