'use client'

import Link from 'next/link'

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-dark text-verde-50 px-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Ocurrió un error</h1>
      <p className="text-verde-400 mb-1 max-w-sm">
        {error.message || 'No pudimos cargar esta página.'}
      </p>
      {error.digest && (
        <p className="text-xs text-verde-700 mb-4">ID: {error.digest}</p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white font-semibold transition-colors"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl border border-verde-800 text-verde-400 hover:text-verde-300 font-semibold transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
