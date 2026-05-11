'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'

export default function DashboardError({
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
        severity: 'error',
        metadata: { digest: error.digest },
      }),
    }).catch(() => null)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-amber-900/30 border border-amber-700/40 flex items-center justify-center">
        <AlertTriangle size={28} className="text-amber-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-verde-100 mb-2">Contenido no disponible</h2>
        <p className="text-sm text-verde-500 max-w-sm">
          Este contenido requiere un plan de pago. Revisa los planes disponibles para continuar.
        </p>
        {error.digest && (
          <p className="text-xs text-verde-800 mt-2">ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/precios"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-verde-700 hover:bg-verde-600 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Ver planes <ArrowRight size={14} />
        </Link>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-verde-800/50 text-verde-400 hover:text-verde-200 hover:border-verde-700 rounded-xl transition-colors text-sm"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
