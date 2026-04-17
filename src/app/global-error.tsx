'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    fetch('/api/monitor/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        message: error.message || error.toString(),
        severity: 'critical',
        metadata: { digest: error.digest },
      }),
    }).catch(() => null)
  }, [error])

  return (
    <html>
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#060d07',
        color: '#f0fdf4',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Algo salió mal
        </h1>
        <p style={{ color: '#4ade80', marginBottom: '1rem', maxWidth: '400px' }}>
          {error.message || 'Ocurrió un error inesperado.'}
        </p>
        {error.digest && (
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            background: '#2e7d32',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Intentar de nuevo
        </button>
      </body>
    </html>
  )
}
