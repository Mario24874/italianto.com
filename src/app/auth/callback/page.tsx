'use client'

import { useEffect } from 'react'

// OAuth redirect bridge for ItaliantoApp native.
// Clerk redirects here after OAuth; this page relays to the app's deep link.
// Chrome Custom Tab cannot handle italiantoapp:// directly — this HTTPS page can.
export default function AuthCallback() {
  useEffect(() => {
    const params = window.location.search
    window.location.href = 'italiantoapp://oauth-native-callback' + params
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      color: '#2e7d32',
    }}>
      <p>Redirigiendo a la app…</p>
    </div>
  )
}
