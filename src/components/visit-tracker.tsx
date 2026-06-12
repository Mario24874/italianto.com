'use client'

import { useEffect } from 'react'

export function VisitTracker() {
  useEffect(() => {
    if (sessionStorage.getItem('it_pv_sent')) return
    sessionStorage.setItem('it_pv_sent', '1')
    fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // crypto.randomUUID no existe en Safari < 15.4 ni en contextos no seguros
        session_id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
        page: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {})
  }, [])

  return null
}
