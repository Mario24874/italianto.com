'use client'

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
export type { Language, Translations } from '@/lib/i18n'
export { LANGUAGES, translations } from '@/lib/i18n'
import type { Language, Translations } from '@/lib/i18n'
import { translations } from '@/lib/i18n'

interface LanguageContextValue {
  lang: Language
  setLang: (l: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'es',
  setLang: () => {},
  t: translations.es,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('es')
  const router = useRouter()

  useEffect(() => {
    try {
      const saved = localStorage.getItem('italianto-lang') as Language | null
      if (saved && ['es', 'it', 'en'].includes(saved)) setLangState(saved)
    } catch {}
  }, [])

  const setLang = useCallback((l: Language) => {
    setLangState(l)
    try {
      localStorage.setItem('italianto-lang', l)
      document.cookie = `italianto-lang=${l};path=/;max-age=31536000;SameSite=Lax`
    } catch {}
    router.refresh()
  }, [router])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
