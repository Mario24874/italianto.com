'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

const MESSAGES = {
  es: {
    title: 'Las cookies están desactivadas en tu navegador.',
    body: 'Italianto necesita cookies para mantener tu sesión. Actívalas en',
    path: 'Configuración → Privacidad → Cookies',
    reload: 'y recarga la página.',
    close: 'Cerrar',
  },
  it: {
    title: 'I cookie sono disabilitati nel tuo browser.',
    body: 'Italianto ha bisogno dei cookie per mantenere la sessione. Abilitali in',
    path: 'Impostazioni → Privacy → Cookie',
    reload: 'e ricarica la pagina.',
    close: 'Chiudi',
  },
  en: {
    title: 'Cookies are disabled in your browser.',
    body: 'Italianto needs cookies to keep your session. Enable them in',
    path: 'Settings → Privacy → Cookies',
    reload: 'and reload the page.',
    close: 'Close',
  },
}

function getLang(): keyof typeof MESSAGES {
  if (typeof navigator === 'undefined') return 'es'
  const code = navigator.language.slice(0, 2).toLowerCase()
  if (code === 'it') return 'it'
  if (code === 'en') return 'en'
  return 'es'
}

/**
 * Detects whether the browser has cookies disabled.
 * Clerk requires cookies for session management.
 * Shows a persistent banner when cookies are blocked.
 */
export function CookieCheck() {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    try {
      document.cookie = '__ctest=1; SameSite=Lax; Secure; path=/'
      const ok = document.cookie.includes('__ctest')
      document.cookie = '__ctest=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      if (!ok) setBlocked(true)
    } catch {
      setBlocked(true)
    }
  }, [])

  if (!blocked) return null

  const m = MESSAGES[getLang()]

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] flex items-start gap-3 bg-red-950 border-t border-red-700 px-4 py-3 text-sm text-red-200"
      role="alert"
    >
      <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <span className="font-semibold text-red-100">{m.title}</span>
        {' '}{m.body}{' '}
        <strong>{m.path}</strong> {m.reload}
      </div>
      <button
        onClick={() => setBlocked(false)}
        className="text-red-400 hover:text-red-200 shrink-0"
        aria-label={m.close}
      >
        <X size={16} />
      </button>
    </div>
  )
}
