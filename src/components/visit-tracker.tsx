'use client'

import { useEffect } from 'react'

const VISIT_API = 'https://app.mariomoreno.work/api/analytics/visit'

export function VisitTracker() {
  useEffect(() => {
    if (sessionStorage.getItem('it_pv_sent')) return
    sessionStorage.setItem('it_pv_sent', '1')
    fetch(VISIT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: crypto.randomUUID(),
        page: window.location.pathname,
        referrer: document.referrer || null,
        source: 'italianto',
      }),
    }).catch(() => {})
  }, [])

  return null
}
