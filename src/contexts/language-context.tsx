'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Language = 'es' | 'it' | 'en'

export const LANGUAGES = [
  { code: 'es' as Language, label: 'Español', flag: '🇪🇸' },
  { code: 'it' as Language, label: 'Italiano', flag: '🇮🇹' },
  { code: 'en' as Language, label: 'English',  flag: '🇬🇧' },
]

// ── Traducciones de la UI ────────────────────────────────────
const translations = {
  es: {
    nav: {
      home: 'Inicio',
      features: 'Funciones',
      pricing: 'Precios',
      about: 'Nosotros',
      contact: 'Contacto',
    },
    auth: {
      signIn: 'Entrar',
      signUp: 'Comenzar gratis',
      myClass: 'Mi aula',
    },
    hero: {
      badge: 'La plataforma de italiano más completa',
      line1: 'Aprende italiano',
      line2: 'con inteligencia',
      line3: 'artificial',
      subtitle: 'Traductor inteligente, conjugador, práctica de pronunciación, diálogos con IA y un tutor conversacional. Todo en un ecosistema diseñado para llevarte al',
      subtitleHighlight: 'italiano fluido',
      cta: 'Comenzar gratis',
      ctaSub: 'Ver las apps',
      stats: { students: 'Estudiantes', apps: 'Apps', rating: 'Rating', lessons: 'Lecciones' },
    },
    footer: {
      tagline: 'La plataforma integral para aprender italiano con inteligencia artificial. Traducción, práctica, diálogos y tutor AI en un solo lugar.',
      love: 'Hecho con amor por el italiano',
      platform: 'Plataforma',
      support: 'Soporte',
      legal: 'Legal',
      rights: 'Todos los derechos reservados.',
      about: 'Sobre nosotros',
      contact: 'Contacto',
      blog: 'Blog',
      privacy: 'Privacidad',
      terms: 'Términos',
      cookies: 'Cookies',
    },
  },
  it: {
    nav: {
      home: 'Home',
      features: 'Funzioni',
      pricing: 'Prezzi',
      about: 'Chi siamo',
      contact: 'Contatti',
    },
    auth: {
      signIn: 'Accedi',
      signUp: 'Inizia gratis',
      myClass: 'La mia aula',
    },
    hero: {
      badge: 'La piattaforma italiana più completa',
      line1: 'Impara l\'italiano',
      line2: 'con intelligenza',
      line3: 'artificiale',
      subtitle: 'Traduttore intelligente, coniugatore, pratica di pronuncia, dialoghi con AI e un tutor conversazionale. Tutto in un ecosistema pensato per portarti a parlare',
      subtitleHighlight: 'italiano fluente',
      cta: 'Inizia gratis',
      ctaSub: 'Vedi le app',
      stats: { students: 'Studenti', apps: 'App', rating: 'Valutazione', lessons: 'Lezioni' },
    },
    footer: {
      tagline: 'La piattaforma completa per imparare l\'italiano con intelligenza artificiale. Traduzione, pratica, dialoghi e tutor AI in un unico posto.',
      love: 'Fatto con amore per l\'italiano',
      platform: 'Piattaforma',
      support: 'Supporto',
      legal: 'Legale',
      rights: 'Tutti i diritti riservati.',
      about: 'Chi siamo',
      contact: 'Contatti',
      blog: 'Blog',
      privacy: 'Privacy',
      terms: 'Termini',
      cookies: 'Cookie',
    },
  },
  en: {
    nav: {
      home: 'Home',
      features: 'Features',
      pricing: 'Pricing',
      about: 'About',
      contact: 'Contact',
    },
    auth: {
      signIn: 'Sign in',
      signUp: 'Start for free',
      myClass: 'My classroom',
    },
    hero: {
      badge: 'The most complete Italian platform',
      line1: 'Learn Italian',
      line2: 'with artificial',
      line3: 'intelligence',
      subtitle: 'Smart translator, conjugator, pronunciation practice, AI-generated dialogues and a conversational tutor. All in one ecosystem built to take you to',
      subtitleHighlight: 'fluent Italian',
      cta: 'Start for free',
      ctaSub: 'See the apps',
      stats: { students: 'Students', apps: 'Apps', rating: 'Rating', lessons: 'Lessons' },
    },
    footer: {
      tagline: 'The complete platform to learn Italian with artificial intelligence. Translation, practice, dialogues and AI tutor all in one place.',
      love: 'Made with love for Italian',
      platform: 'Platform',
      support: 'Support',
      legal: 'Legal',
      rights: 'All rights reserved.',
      about: 'About us',
      contact: 'Contact',
      blog: 'Blog',
      privacy: 'Privacy',
      terms: 'Terms',
      cookies: 'Cookies',
    },
  },
}

export type Translations = typeof translations.es

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

  useEffect(() => {
    const saved = localStorage.getItem('italianto-lang') as Language | null
    if (saved && ['es', 'it', 'en'].includes(saved)) setLangState(saved)
  }, [])

  const setLang = (l: Language) => {
    setLangState(l)
    localStorage.setItem('italianto-lang', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
