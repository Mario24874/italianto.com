'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/monitor/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        message: error.message || error.toString(),
        severity: 'error',
        metadata: { digest: error.digest },
      }),
    }).catch(() => null)

    router.replace('/precios')
  }, [error, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-verde-600 text-sm animate-pulse">Redirigiendo...</p>
    </div>
  )
}
