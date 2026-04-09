'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mic, MicOff, Send, Volume2, VolumeX, Loader2, Bot,
  AlertTriangle, ArrowLeft, Settings, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLANS } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TutorPrefs {
  registro: 'informale' | 'formale'
  tono: 'amichevole' | 'professionale' | 'incoraggiante'
  focus: 'conversazione' | 'grammatica' | 'vocabolario' | 'pronuncia'
  modismi: 'neutro' | 'roma' | 'milano' | 'napoli'
  livello: 'A1' | 'A2' | 'B1'
}

const DEFAULT_PREFS: TutorPrefs = {
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

// ── Radio group helper ────────────────────────────────────────────────────────
function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-verde-400 uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              value === opt.value
                ? 'bg-verde-700/60 border-verde-600 text-verde-100'
                : 'bg-verde-950/30 border-verde-900/40 text-verde-500 hover:text-verde-300 hover:border-verde-700/50',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function TutorChat({
  tutorName,
  tutorSlug,
  avatarUrl,
  voiceId,
  gender = 'neutral',
  minutesUsed,
  planType,
}: TutorChatProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localMinutes, setLocalMinutes] = useState(minutesUsed)
  const [showSettings, setShowSettings] = useState(false)
  const [prefs, setPrefs] = useState<TutorPrefs>(DEFAULT_PREFS)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  const recognitionRef = useRef<{ stop: () => void } | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const plan = PLANS.find(p => p.id === planType)
  const minuteLimit = plan?.limits.tutorMinutes ?? null
  const minutesLeft = minuteLimit !== null ? Math.max(0, minuteLimit - Math.floor(localMinutes)) : null

  // Load saved prefs
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY)
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) })
    } catch {}
  }, [])

  const savePrefs = useCallback((next: TutorPrefs) => {
    setPrefs(next)
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)) } catch {}
  }, [])

  // Keep ref in sync so speech callbacks always have fresh messages
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const greeting: Message = {
      role: 'assistant',
      content: `Ciao! Sono ${tutorName}, il tuo tutor di italiano. Come stai oggi? Di cosa vorresti parlare?`,
    }
    setMessages([greeting])
  }, [tutorName])

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    if (currentUtteranceRef.current) {
      window.speechSynthesis?.cancel()
      currentUtteranceRef.current = null
    }
  }, [])

  const playWebSpeech = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'it-IT'
    utterance.rate = 0.9
    // Lower pitch to approximate male voice when the browser has no male Italian voice
    utterance.pitch = gender === 'male' ? 0.8 : gender === 'female' ? 1.1 : 1.0

    const voices = window.speechSynthesis.getVoices()
    const italianVoices = voices.filter(v => v.lang.startsWith('it'))

    if (italianVoices.length > 0) {
      // Known Italian male voice names across browsers/OS:
      // Chrome/Windows: "Microsoft Cosimo", Chrome/macOS: "Luca", some systems: "Giorgio"
      const MALE_NAMES = /cosimo|luca|giorgio|marco|antonio|roberto|david/i
      const FEMALE_NAMES = /elsa|alice|francesca|giulia|federica|paola|google italiano/i

      const genderMatch = gender === 'male'
        ? italianVoices.find(v => MALE_NAMES.test(v.name))
            ?? italianVoices.find(v => !FEMALE_NAMES.test(v.name))
            ?? italianVoices[italianVoices.length - 1]
        : gender === 'female'
        ? italianVoices.find(v => FEMALE_NAMES.test(v.name)) ?? italianVoices[0]
        : italianVoices[0]
      utterance.voice = genderMatch
    }

    utterance.onstart = () => setTtsLoading(false)
    utterance.onend = () => { currentUtteranceRef.current = null }
    utterance.onerror = () => { currentUtteranceRef.current = null; setTtsLoading(false) }
    currentUtteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [gender])

  const playTTS = useCallback(async (text: string) => {
    if (!ttsEnabled) return
    stopCurrentAudio()
    setTtsLoading(true)

    // If a cloned ElevenLabs voiceId is configured, try it first
    if (voiceId) {
      try {
        const res = await fetch('/api/tutor/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice_id: voiceId }),
        })
        if (res.ok) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          currentAudioRef.current = audio
          audio.onended = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; setTtsLoading(false) }
          audio.onerror = () => { setTtsLoading(false) }
          await audio.play()
          return
        }
      } catch {
        // ElevenLabs failed — fall through to Web Speech API
      }
    }

    // Web Speech API (free, browser-native, Italian voices)
    playWebSpeech(text)
  }, [ttsEnabled, voiceId, stopCurrentAudio, playWebSpeech])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setError(null)
    const userMsg: Message = { role: 'user', content: trimmed }
    const newMessages = [...messagesRef.current, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, tutorName, tutorSlug, prefs }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Errore del tutor'); return }

      const assistantMsg: Message = { role: 'assistant', content: data.text }
      setMessages(prev => [...prev, assistantMsg])
      setLocalMinutes(prev => prev + 0.1)
      playTTS(data.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di rete')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [loading, tutorName, tutorSlug, prefs, playTTS])

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Riconoscimento vocale non supportato. Usa Chrome o Edge.')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any
    recognition.lang = 'it-IT'
    recognition.continuous = false
    recognition.interimResults = false

    let hasResult = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      hasResult = true
      const transcript: string = e.results[0][0].transcript
      sendMessage(transcript)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      setIsListening(false)
      const msgs: Record<string, string> = {
        'not-allowed':   'Accesso al microfono negato. Abilitalo nella barra degli indirizzi del browser.',
        'no-speech':     'Nessuna voce rilevata. Parla più vicino al microfono e riprova.',
        'network':       'Errore di rete nel riconoscimento vocale. Verifica la connessione.',
        'audio-capture': 'Microfono non trovato. Verifica che sia collegato.',
        'aborted':       '',
      }
      const msg = msgs[e.error as string]
      if (msg) setError(msg)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (!hasResult) { /* ended without capturing — user can retry */ }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setError(null)
  }, [sendMessage])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const toggleTTS = useCallback(() => {
    stopCurrentAudio()
    setTtsEnabled(v => !v)
  }, [stopCurrentAudio])

  // ── Settings panel ────────────────────────────────────────────────────────
  const SettingsPanel = (
    <div className="absolute inset-0 bg-bg-dark z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-verde-900/30 shrink-0">
        <div className="flex items-center gap-2">
          <Settings size={15} className="text-verde-400" />
          <span className="font-bold text-verde-100 text-sm">Preferenze sessione</span>
        </div>
        <button
          onClick={() => setShowSettings(false)}
          className="p-1.5 rounded-lg text-verde-500 hover:text-verde-300 hover:bg-verde-950/50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        <p className="text-verde-600 text-xs leading-relaxed">
          Queste preferenze personalizzano il comportamento del tutor per tutta la sessione.
          Vengono salvate automaticamente.
        </p>

        <RadioGroup
          label="Registro"
          value={prefs.registro}
          onChange={v => savePrefs({ ...prefs, registro: v })}
          options={[
            { value: 'informale', label: 'Informale (tu)' },
            { value: 'formale', label: 'Formale (Lei)' },
          ]}
        />

        <RadioGroup
          label="Tono del tutor"
          value={prefs.tono}
          onChange={v => savePrefs({ ...prefs, tono: v })}
          options={[
            { value: 'amichevole', label: 'Amichevole' },
            { value: 'professionale', label: 'Professionale' },
            { value: 'incoraggiante', label: 'Incoraggiante' },
          ]}
        />

        <RadioGroup
          label="Focus della sessione"
          value={prefs.focus}
          onChange={v => savePrefs({ ...prefs, focus: v })}
          options={[
            { value: 'conversazione', label: 'Conversazione libera' },
            { value: 'grammatica', label: 'Grammatica' },
            { value: 'vocabolario', label: 'Vocabolario' },
            { value: 'pronuncia', label: 'Pronuncia' },
          ]}
        />

        <RadioGroup
          label="Modismi italiani"
          value={prefs.modismi}
          onChange={v => savePrefs({ ...prefs, modismi: v })}
          options={[
            { value: 'neutro', label: 'Italiano neutro' },
            { value: 'roma', label: 'Romano' },
            { value: 'milano', label: 'Milanese' },
            { value: 'napoli', label: 'Napoletano' },
          ]}
        />

        <RadioGroup
          label="Il tuo livello"
          value={prefs.livello}
          onChange={v => savePrefs({ ...prefs, livello: v })}
          options={[
            { value: 'A1', label: 'A1 — Principiante' },
            { value: 'A2', label: 'A2 — Base' },
            { value: 'B1', label: 'B1 — Intermedio' },
          ]}
        />

        {/* Summary */}
        <div className="rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-3 text-xs text-verde-500 space-y-1">
          <p className="font-semibold text-verde-400 mb-2">Riepilogo preferenze attive</p>
          <p>Registro: <span className="text-verde-300">{prefs.registro === 'formale' ? 'Formale (Lei)' : 'Informale (tu)'}</span></p>
          <p>Tono: <span className="text-verde-300 capitalize">{prefs.tono}</span></p>
          <p>Focus: <span className="text-verde-300 capitalize">{prefs.focus}</span></p>
          <p>Modismi: <span className="text-verde-300 capitalize">{prefs.modismi === 'neutro' ? 'Italiano neutro' : prefs.modismi}</span></p>
          <p>Livello: <span className="text-verde-300">{prefs.livello}</span></p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-5 pt-2 shrink-0 border-t border-verde-900/30">
        <button
          onClick={() => setShowSettings(false)}
          className="w-full py-3 bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Salva e torna alla chat
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full relative">
      {/* ── Settings overlay ── */}
      {showSettings && SettingsPanel}

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-verde-900/30 bg-bg-dark/60 backdrop-blur shrink-0">
        <button
          onClick={() => router.push('/tutor')}
          className="p-1.5 rounded-lg text-verde-500 hover:text-verde-300 hover:bg-verde-950/50 transition-colors shrink-0"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Avatar */}
        <div className="relative size-10 rounded-full overflow-hidden ring-2 ring-verde-700 shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={tutorName} className="size-full object-cover" />
          ) : (
            <div className="size-full bg-verde-900/60 flex items-center justify-center">
              <Bot size={18} className="text-verde-400" />
            </div>
          )}
          <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full border-2 border-bg-dark" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-verde-100 text-sm leading-tight">{tutorName}</p>
          <p className="text-verde-500 text-xs capitalize">
            {prefs.tono} · {prefs.focus} · {prefs.livello}
          </p>
        </div>

        {minuteLimit !== null && (
          <div className="text-right shrink-0 mr-1">
            <p className="text-xs text-verde-600">Min rimasti</p>
            <p className={cn('font-bold text-sm leading-tight', minutesLeft === 0 ? 'text-red-400' : 'text-verde-300')}>
              {minutesLeft}<span className="text-verde-600 font-normal text-xs">/{minuteLimit}</span>
            </p>
          </div>
        )}

        <button
          onClick={() => setShowSettings(true)}
          title="Preferenze sessione"
          className="p-2 rounded-xl text-verde-500 hover:text-verde-300 hover:bg-verde-950/40 transition-colors shrink-0"
        >
          <Settings size={15} />
        </button>

        <button
          onClick={toggleTTS}
          title={ttsEnabled ? 'Disattiva voce' : 'Attiva voce'}
          className={cn(
            'p-2 rounded-xl transition-colors shrink-0',
            ttsEnabled ? 'text-verde-400 bg-verde-900/30 hover:bg-verde-900/50'
                       : 'text-verde-600 hover:text-verde-400 hover:bg-verde-950/40',
          )}
        >
          {ttsLoading ? <Loader2 size={15} className="animate-spin" />
                      : ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-2.5 items-end', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            {msg.role === 'assistant' && (
              <div className="size-7 rounded-full overflow-hidden ring-1 ring-verde-800 shrink-0 mb-0.5">
                {avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarUrl} alt={tutorName} className="size-full object-cover" />
                  : <div className="size-full bg-verde-900/60 flex items-center justify-center"><Bot size={13} className="text-verde-400" /></div>
                }
              </div>
            )}
            <div className={cn(
              'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-verde-700 text-white rounded-br-sm'
                : 'bg-verde-950/70 border border-verde-900/40 text-verde-100 rounded-bl-sm',
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 items-end">
            <div className="size-7 rounded-full bg-verde-900/60 ring-1 ring-verde-800 flex items-center justify-center shrink-0 mb-0.5">
              <Bot size={13} className="text-verde-400" />
            </div>
            <div className="bg-verde-950/70 border border-verde-900/40 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <span className="size-1.5 bg-verde-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="size-1.5 bg-verde-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="size-1.5 bg-verde-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-4 py-2.5 bg-red-950/30 border border-red-800/40 rounded-xl text-red-400 text-sm">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-400">✕</button>
        </div>
      )}

      {/* ── Input ── */}
      <div className="px-4 pb-4 pt-2 border-t border-verde-900/30 bg-bg-dark/40 shrink-0">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder={isListening ? '🎙 Sto ascoltando...' : 'Scrivi in italiano...'}
            disabled={loading || isListening}
            className="flex-1 bg-verde-950/40 border border-verde-900/40 rounded-xl px-4 py-3 text-sm text-verde-100
              placeholder:text-verde-600 focus:outline-none focus:ring-1 focus:ring-verde-700 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim() || isListening}
            className="p-3 bg-verde-700 hover:bg-verde-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            title={isListening ? 'Ferma registrazione' : 'Parla in italiano'}
            className={cn(
              'p-3 rounded-xl transition-all shrink-0',
              isListening
                ? 'bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-400/40 animate-pulse'
                : 'bg-verde-950/50 border border-verde-900/40 text-verde-400 hover:text-verde-200 hover:border-verde-700 disabled:opacity-40',
            )}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>
        <p className="text-verde-700 text-xs text-center mt-2 select-none">
          {isListening ? 'Parla in italiano — si ferma automaticamente al silenzio'
                       : 'Microfono per parlare · Invio per inviare'}
        </p>
      </div>

    </div>
  )
}
