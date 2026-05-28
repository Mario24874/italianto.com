'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'

export default function SessionTracker() {
  const { user, isLoaded } = useUser()
  const sessionIdRef = useRef<string | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isLoaded || !user) return

    async function startSession() {
      try {
        const res = await fetch('/api/sessions/track', { method: 'POST' })
        if (!res.ok) return
        const { sessionId } = await res.json()
        sessionIdRef.current = sessionId
        startTimeRef.current = Date.now()
      } catch {
        // non-critical
      }
    }

    function endSession() {
      const sessionId = sessionIdRef.current
      const startTime = startTimeRef.current
      if (!sessionId || startTime === null) return

      const duration = Math.round((Date.now() - startTime) / 1000)
      sessionIdRef.current = null
      startTimeRef.current = null

      fetch('/api/sessions/track', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, duration }),
        keepalive: true,
      }).catch(() => {})
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        endSession()
      } else if (document.visibilityState === 'visible' && !sessionIdRef.current) {
        startSession()
      }
    }

    startSession()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      endSession()
    }
  }, [user?.id, isLoaded])

  return null
}
