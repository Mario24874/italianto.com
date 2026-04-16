'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

/**
 * Detects whether the browser has cookies disabled.
 * Clerk requires cookies for session management.
 * Shows a persistent banner when cookies are blocked.
 */
export function CookieCheck() {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    try {
      // Write a test cookie, read it back
      document.cookie = '__cookie_test=1; SameSite=Lax; Secure; path=/'
      const ok = document.cookie.includes('__cookie_test')
      // Clean up
      document.cookie = '__cookie_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      if (!ok) setBlocked(true)
    } catch {
      setBlocked(true)
    }
  }, [])

  if (!blocked) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] flex items-start gap-3 bg-red-950 border-t border-red-700 px-4 py-3 text-sm text-red-200"
      role="alert"
    >
      <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <span className="font-semibold text-red-100">Las cookies están desactivadas en tu navegador.</span>
        {' '}Italianto necesita cookies para mantener tu sesión. Actívalas en{' '}
        <strong>Configuración → Privacidad → Cookies</strong> y recarga la página.
      </div>
      <button
        onClick={() => setBlocked(false)}
        className="text-red-400 hover:text-red-200 shrink-0"
        aria-label="Cerrar"
      >
        <X size={16} />
      </button>
    </div>
  )
}
