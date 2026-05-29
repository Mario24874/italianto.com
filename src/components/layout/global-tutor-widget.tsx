'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Maximize2, X, Mic, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTutorSession } from '@/contexts/tutor-session-context'
import { TutorLive } from '@/components/tutor/tutor-live'

// ── Equalizer bars (same as TutorLive, self-contained here) ──────────────────
function BubbleEqualizer({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[...Array(4)].map((_, i) => (
        active
          ? <div key={i} className="eq-bar w-0.5 rounded-sm bg-verde-400" style={{ height: '100%', animationDelay: `${i * 0.1}s` }} />
          : <div key={i} className="w-0.5 rounded-sm bg-verde-700/50" style={{ height: 4 }} />
      ))}
    </div>
  )
}

// ── Draggable bubble ──────────────────────────────────────────────────────────
function DraggableBubble() {
  const { activeTutor, callStatus, liveAvatarSrc, liveDisplayName, expand, deactivateSession, startCallRef, doEndCallRef } = useTutorSession()
  const isSpeaking = callStatus === 'speaking'
  const isListening = callStatus === 'listening'
  const isConnecting = callStatus === 'connecting'
  const inCall = callStatus !== 'idle'

  // Initial position: bottom-right, above the music mini-player
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    setPos({ x: window.innerWidth - 220, y: window.innerHeight - 180 })
  }, [])

  const dragState = useRef({ active: false, startClientX: 0, startClientY: 0, startX: 0, startY: 0 })
  const posRef = useRef(pos)
  posRef.current = pos

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current.active || !posRef.current) return
    const dx = e.clientX - dragState.current.startClientX
    const dy = e.clientY - dragState.current.startClientY
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 200, dragState.current.startX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 72, dragState.current.startY + dy)),
    })
  }, [])

  const onMouseUp = useCallback(() => {
    dragState.current.active = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  function startDrag(e: React.MouseEvent) {
    if (!pos) return
    dragState.current = { active: true, startClientX: e.clientX, startClientY: e.clientY, startX: pos.x, startY: pos.y }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Touch support
  function startTouchDrag(e: React.TouchEvent) {
    if (!pos) return
    const t = e.touches[0]
    dragState.current = { active: true, startClientX: t.clientX, startClientY: t.clientY, startX: pos.x, startY: pos.y }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragState.current.active || !pos) return
    const t = e.touches[0]
    const dx = t.clientX - dragState.current.startClientX
    const dy = t.clientY - dragState.current.startClientY
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 200, dragState.current.startX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 72, dragState.current.startY + dy)),
    })
  }
  function onTouchEnd() { dragState.current.active = false }

  function handleClose() {
    doEndCallRef.current?.()
    deactivateSession()
  }

  if (!activeTutor || pos === null) return null

  return (
    <div
      className="fixed z-[60] flex items-center gap-2.5 px-3 py-2.5 bg-[#080e08]/95 border border-verde-800/40 rounded-2xl shadow-2xl backdrop-blur-md select-none touch-none"
      style={{ left: pos.x, top: pos.y, minWidth: 190 }}
      onMouseDown={startDrag}
      onTouchStart={startTouchDrag}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Avatar — use liveAvatarSrc (synced from TutorLive prefs) with fallback to initial */}
      <div className={cn(
        'size-10 rounded-full overflow-hidden ring-2 shrink-0 transition-all',
        isSpeaking ? 'ring-verde-500 scale-105' : 'ring-verde-800/60',
      )}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={liveAvatarSrc ?? activeTutor.avatarSrc} alt={activeTutor.name} className="size-full object-cover" />
      </div>

      {/* Name + status */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-xs font-semibold text-verde-200 truncate leading-tight">{liveDisplayName ?? activeTutor.name}</span>
        <BubbleEqualizer active={isSpeaking} />
      </div>

      {/* Talk button */}
      <button
        title={inCall ? (isSpeaking ? `${activeTutor.name} parlando...` : 'In ascolto') : 'Parla con il tutor'}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation()
          if (!inCall) startCallRef.current?.()
        }}
        className={cn(
          'shrink-0 size-8 rounded-full flex items-center justify-center border transition-colors',
          isConnecting && 'border-amber-700/60 text-amber-400 animate-pulse',
          isListening && 'border-blue-700/60 text-blue-400 bg-blue-950/30',
          isSpeaking && 'border-verde-700/60 text-verde-400 bg-verde-950/30',
          !inCall && 'border-verde-800/50 text-verde-500 hover:text-verde-300 hover:border-verde-600 hover:bg-verde-950/40',
        )}
      >
        {isConnecting
          ? <div className="size-3 rounded-full border border-amber-400 border-t-transparent animate-spin" />
          : inCall
          ? <Mic size={13} />
          : <Phone size={13} />
        }
      </button>

      {/* Expand */}
      <button
        title="Expandir tutor"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); expand() }}
        className="shrink-0 size-7 rounded-lg flex items-center justify-center text-verde-600 hover:text-verde-300 hover:bg-verde-950/40 transition-colors"
      >
        <Maximize2 size={12} />
      </button>

      {/* Close */}
      <button
        title="Cerrar sesión"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); handleClose() }}
        className="shrink-0 size-7 rounded-lg flex items-center justify-center text-verde-700 hover:text-red-400 hover:bg-red-950/20 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ── Main widget ───────────────────────────────────────────────────────────────
export function GlobalTutorWidget() {
  const { activeTutor, isMinimized, minimize, deactivateSession } = useTutorSession()
  const pathname = usePathname()

  // Auto-minimize when navigating away from the tutor page
  useEffect(() => {
    if (activeTutor && isMinimized === false && !pathname.startsWith('/tutor/')) {
      minimize()
    }
  }, [pathname, activeTutor, isMinimized, minimize])

  if (!activeTutor) return null

  return (
    <>
      {/* Full panel — always mounted so audio/WebSocket survives; hidden via display:none when minimized */}
      <div
        className={cn(
          'fixed inset-0 z-[50] bg-bg-dark',
          isMinimized ? 'hidden' : 'flex flex-col',
        )}
      >
        <TutorLive
          tutorName={activeTutor.name}
          tutorSlug={activeTutor.slug}
          avatarUrl={activeTutor.avatarSrc}
          geminiVoice={activeTutor.geminiVoice}
          minutesUsed={activeTutor.minutesUsed}
          planType={activeTutor.planType}
          onRequestMinimize={minimize}
          onClose={() => {
            deactivateSession()
          }}
        />
      </div>

      {/* Floating draggable bubble — only shown when minimized */}
      {isMinimized && <DraggableBubble />}
    </>
  )
}
