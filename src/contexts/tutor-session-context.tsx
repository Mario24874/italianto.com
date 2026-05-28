'use client'

import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react'
import type { PlanType } from '@/lib/plans'

export type TutorCallStatus = 'idle' | 'connecting' | 'listening' | 'speaking'

export interface ActiveTutorData {
  slug: string
  name: string
  avatarSrc: string
  geminiVoice: string
  minutesUsed: number
  planType: PlanType
}

interface TutorSessionContextValue {
  activeTutor: ActiveTutorData | null
  callStatus: TutorCallStatus
  isMinimized: boolean

  // Refs registered by TutorLive so bubble can trigger actions (user gesture preserved)
  startCallRef: React.MutableRefObject<(() => void) | null>
  doEndCallRef: React.MutableRefObject<(() => void) | null>

  activateSession: (data: ActiveTutorData) => void
  deactivateSession: () => void
  setCallStatus: (s: TutorCallStatus) => void
  minimize: () => void
  expand: () => void
}

const TutorSessionContext = createContext<TutorSessionContextValue>({
  activeTutor: null,
  callStatus: 'idle',
  isMinimized: false,
  startCallRef: { current: null },
  doEndCallRef: { current: null },
  activateSession: () => {},
  deactivateSession: () => {},
  setCallStatus: () => {},
  minimize: () => {},
  expand: () => {},
})

export function TutorSessionProvider({ children }: { children: ReactNode }) {
  const [activeTutor, setActiveTutor] = useState<ActiveTutorData | null>(null)
  const [callStatus, setCallStatus] = useState<TutorCallStatus>('idle')
  const [isMinimized, setIsMinimized] = useState(false)

  const startCallRef = useRef<(() => void) | null>(null)
  const doEndCallRef = useRef<(() => void) | null>(null)

  const activateSession = useCallback((data: ActiveTutorData) => {
    setActiveTutor(data)
    setIsMinimized(false)
    setCallStatus('idle')
  }, [])

  const deactivateSession = useCallback(() => {
    doEndCallRef.current?.()
    setActiveTutor(null)
    setCallStatus('idle')
    setIsMinimized(false)
    startCallRef.current = null
    doEndCallRef.current = null
  }, [])

  const minimize = useCallback(() => setIsMinimized(true), [])
  const expand = useCallback(() => setIsMinimized(false), [])

  return (
    <TutorSessionContext.Provider value={{
      activeTutor, callStatus, isMinimized,
      startCallRef, doEndCallRef,
      activateSession, deactivateSession,
      setCallStatus, minimize, expand,
    }}>
      {children}
    </TutorSessionContext.Provider>
  )
}

export const useTutorSession = () => useContext(TutorSessionContext)
