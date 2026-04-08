'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, Bot, AlertTriangle, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLANS } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TutorChatProps {
  tutorName: string
  tutorSlug: string
  avatarUrl: string | null
  voiceId: string | null
  minutesUsed: number
  planType: PlanType
}

export function TutorChat({ tutorName, tutorSlug, avatarUrl, voiceId, minutesUsed, planType }: TutorChatProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localMinutes, setLocalMinutes] = useState(minutesUsed)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  const recognitionRef = useRef<{ stop: () => void } | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const plan = PLANS.find(p => p.id === planType)
  const minuteLimit = plan?.limits.tutorMinutes ?? null
  const minutesLeft = minuteLimit !== null ? Math.max(0, minuteLimit - Math.floor(localMinutes)) : null

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

  const playTTS = useCallback(async (text: string) => {
    if (!ttsEnabled) return
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    setTtsLoading(true)
    try {
      const res = await fetch('/api/tutor/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: voiceId }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudioRef.current = audio
      audio.onended = () => { URL.revokeObjectURL(url); currentAudioRef.current = null }
      await audio.play()
    } catch {
      // non-fatal
    } finally {
      setTtsLoading(false)
    }
  }, [ttsEnabled, voiceId])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setError(null)
    const userMsg: Message = { role: 'user', content: trimmed }
    // Use ref to avoid stale closure when called from speech recognition
    const newMessages = [...messagesRef.current, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, tutorName, tutorSlug }),
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
  }, [loading, tutorName, tutorSlug, playTTS])

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
      if (!hasResult) {
        // ended without capturing — do nothing, user can try again
      }
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
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null }
    setTtsEnabled(v => !v)
  }, [])

  return (
    <div className="flex flex-col h-full">
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
          <p className="text-verde-500 text-xs">Tutor AI · Italiano</p>
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
