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
        session_id: crypto.randomUUID(),
        page: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {})
  }, [])

  return null
}
