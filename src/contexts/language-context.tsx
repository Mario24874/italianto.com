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
    features: {
      badge: 'Funcionalidades',
      title1: 'Todo lo que necesitas',
      title2: 'para el italiano',
      subtitle: 'Un ecosistema completo de herramientas educativas impulsadas por IA para que aprendas a tu ritmo, en tu idioma y desde cualquier dispositivo.',
      cards: {
        translator: { title: 'Traductor Inteligente', description: 'Traduce entre español, inglés e italiano con un diccionario de 800+ palabras. Historial y favoritos incluidos.' },
        conjugator: { title: 'Conjugador Completo', description: '50+ verbos con 6 tiempos verbales. Pronunciación en audio integrada.' },
        pronunciation: { title: 'Práctica de Pronunciación', description: 'Reconocimiento de voz en tiempo real. Scoring preciso y retroalimentación instantánea.' },
        dialogues: { title: 'Diálogos con IA', description: 'Genera diálogos italianos auténticos por contexto o traduce conversaciones. Salida como texto o audio MP3 con voces únicas por personaje.' },
        tutor: { title: 'Tutor AI Conversacional', description: 'Practica conversaciones reales con un tutor IA que corrige tu gramática en tiempo real.' },
        videos: { title: 'Videos y Lecciones', description: 'Biblioteca de contenido multimedia: vocales, consonantes, meses, estaciones y más.' },
        songs: { title: 'Canciones en Italiano', description: 'Aprende vocabulario y pronunciación a través de la música italiana.' },
        games: { title: 'Juegos Educativos', description: 'Refuerza lo aprendido con minijuegos diseñados para la retención de vocabulario.' },
      },
      tags: { soon: 'Próximamente', platform: 'Plataforma' },
    },
    apps: {
      badge: 'Ecosistema de Apps',
      title1: 'Dos herramientas poderosas,',
      title2: 'una sola suscripción',
      subtitle: 'Con tu cuenta Italianto accedes a todo el ecosistema. Mobile, web, desktop — tu aprendizaje no tiene límites de dispositivo.',
      app1: {
        tag: 'App Móvil + PWA',
        subtitle: 'Tu compañero de italiano en el bolsillo',
        description: 'La aplicación móvil completa para aprender italiano. Disponible en Android, iOS y como aplicación web progresiva (PWA). Aprende sin conexión a internet.',
        features: [
          'Traductor bidireccional (ES/EN ↔ IT)',
          'Conjugador de 50+ verbos',
          'Práctica de pronunciación con IA',
          'Tutor conversacional con IA',
        ],
        cta: 'Usar la app',
      },
      app2: {
        tag: 'Web App',
        subtitle: 'Crea diálogos italianos con IA',
        description: 'Genera o traduce diálogos al italiano con múltiples personajes. Exporta como texto o audio MP3 con voces naturales. Perfecto para practicar conversaciones reales.',
        features: [
          'Generación de diálogos por contexto',
          'Traducción al italiano (ES/EN)',
          'Audio MP3 con voces naturales',
          'Soporte de carga de archivos TXT/PDF',
        ],
        cta: 'Abrir Studio',
      },
    },
    pricing: {
      badge: 'Precios',
      title1: 'Elige tu plan,',
      title2: 'empieza hoy',
      subtitle: 'Comienza gratis y actualiza cuando lo necesites. Sin contratos, cancela cuando quieras.',
      monthly: 'Mensual',
      annual: 'Anual',
      free: 'Gratis',
      startFree: 'Comenzar gratis',
      choose: 'Elegir',
      footer: 'Todos los planes incluyen acceso a ItaliantoApp y Dialogue Studio. Sin cargos ocultos. Cancela en cualquier momento.',
      perMonth: '/mes',
      perYear: '/año',
      approxPerMonth: '/mes',
      popular: 'Más popular',
      allIncluded: 'Todo incluido',
      tutor: 'Tutor AI',
      audio: 'Audio generado',
      plans: {
        free: {
          description: 'Para empezar a explorar',
          features: ['Traductor básico (es ↔ it)', 'Conjugador de 20 verbos', 'Práctica de pronunciación', '3 diálogos escritos/mes', 'ItalianBot asistente', 'Videos y contenido básico'],
        },
        essenziale: {
          description: 'Para aprendizaje activo',
          features: ['Todo lo gratuito', '30 min Tutor AI/mes', '20 diálogos escritos/mes', '5 audios generados/mes', 'Acceso a lecciones básicas', 'Soporte por email'],
        },
        avanzato: {
          description: 'Para hablar con fluidez',
          features: ['Todo lo esencial', '60 min Tutor AI/mes', '80 diálogos escritos/mes', '30 audios generados/mes', 'Cursos en vivo con descuento', 'Soporte prioritario'],
        },
        maestro: {
          description: 'Para la inmersión total',
          features: ['Todo lo avanzado', 'Tutor AI ilimitado', 'Diálogos ilimitados', 'Audios ilimitados', 'Cursos en vivo incluidos', 'Acceso anticipado a nuevas funciones', 'Manager de cuenta dedicado'],
        },
      },
    },
    social: {
      badge: 'Comunidad',
      title: 'Únete a la comunidad',
      subtitle: 'Contenido gratuito a diario en nuestras redes sociales. Frases, pronunciación, cultura italiana y tips para acelerar tu aprendizaje.',
      youtube: { description: 'Lecciones en video, pronunciación y cultura italiana.', cta: 'Ver canal' },
      instagram: { description: 'Frases del día, vocabulario y snippets culturales.', cta: 'Seguir' },
      followers: 'seguidores',
      ctaTitle: '¿Listo para hablar italiano?',
      ctaSub: 'Regístrate gratis. Sin tarjeta de crédito.',
      ctaBtn: 'Comenzar gratis →',
    },
    contact: {
      badge: 'Contacto',
      title: 'Escríbenos',
      subtitle: 'Tenemos una respuesta para cada pregunta. Te respondemos en menos de 24 horas.',
      name: 'Tu nombre',
      email: 'Tu correo electrónico',
      phone: 'Teléfono (opcional)',
      message: 'Tu mensaje',
      send: 'Enviar mensaje',
      sending: 'Enviando...',
      success: '¡Mensaje enviado! Te responderemos a la brevedad.',
      error: 'Hubo un error al enviar. Por favor intenta de nuevo.',
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
      line1: "Impara l'italiano",
      line2: 'con intelligenza',
      line3: 'artificiale',
      subtitle: 'Traduttore intelligente, coniugatore, pratica di pronuncia, dialoghi con AI e un tutor conversazionale. Tutto in un ecosistema pensato per portarti a parlare',
      subtitleHighlight: 'italiano fluente',
      cta: 'Inizia gratis',
      ctaSub: 'Vedi le app',
      stats: { students: 'Studenti', apps: 'App', rating: 'Valutazione', lessons: 'Lezioni' },
    },
    features: {
      badge: 'Funzionalità',
      title1: 'Tutto ciò di cui hai bisogno',
      title2: "per l'italiano",
      subtitle: "Un ecosistema completo di strumenti educativi potenziati dall'IA per imparare al tuo ritmo, nella tua lingua e da qualsiasi dispositivo.",
      cards: {
        translator: { title: 'Traduttore Intelligente', description: 'Traduci tra spagnolo, inglese e italiano con un dizionario di 800+ parole. Cronologia e preferiti inclusi.' },
        conjugator: { title: 'Coniugatore Completo', description: '50+ verbi con 6 tempi verbali. Pronuncia audio integrata.' },
        pronunciation: { title: 'Pratica di Pronuncia', description: 'Riconoscimento vocale in tempo reale. Punteggio preciso e feedback istantaneo.' },
        dialogues: { title: "Dialoghi con l'IA", description: 'Genera dialoghi italiani autentici per contesto o traduci conversazioni. Output come testo o MP3 con voci uniche per personaggio.' },
        tutor: { title: 'Tutor AI Conversazionale', description: 'Pratica conversazioni reali con un tutor IA che corregge la tua grammatica in tempo reale.' },
        videos: { title: 'Video e Lezioni', description: 'Biblioteca di contenuti multimediali: vocali, consonanti, mesi, stagioni e altro.' },
        songs: { title: 'Canzoni in Italiano', description: 'Impara vocabolario e pronuncia attraverso la musica italiana.' },
        games: { title: 'Giochi Educativi', description: 'Rinforza ciò che hai imparato con minigiochi progettati per la memorizzazione del vocabolario.' },
      },
      tags: { soon: 'Prossimamente', platform: 'Piattaforma' },
    },
    apps: {
      badge: 'Ecosistema di App',
      title1: 'Due strumenti potenti,',
      title2: 'un solo abbonamento',
      subtitle: "Con il tuo account Italianto accedi a tutto l'ecosistema. Mobile, web, desktop — il tuo apprendimento non ha limiti di dispositivo.",
      app1: {
        tag: 'App Mobile + PWA',
        subtitle: "Il tuo compagno d'italiano in tasca",
        description: "L'applicazione mobile completa per imparare l'italiano. Disponibile su Android, iOS e come Progressive Web App (PWA). Impara anche offline.",
        features: [
          'Traduttore bidirezionale (ES/EN ↔ IT)',
          'Coniugatore di 50+ verbi',
          "Pratica di pronuncia con l'IA",
          "Tutor conversazionale con l'IA",
        ],
        cta: "Usa l'app",
      },
      app2: {
        tag: 'Web App',
        subtitle: "Crea dialoghi italiani con l'IA",
        description: 'Genera o traduci dialoghi in italiano con più personaggi. Esporta come testo o audio MP3 con voci naturali. Perfetto per praticare conversazioni reali.',
        features: [
          'Generazione di dialoghi per contesto',
          'Traduzione in italiano (ES/EN)',
          'Audio MP3 con voci naturali',
          'Supporto caricamento file TXT/PDF',
        ],
        cta: 'Apri Studio',
      },
    },
    pricing: {
      badge: 'Prezzi',
      title1: 'Scegli il tuo piano,',
      title2: 'inizia oggi',
      subtitle: 'Inizia gratis e aggiorna quando ne hai bisogno. Senza contratti, cancella quando vuoi.',
      monthly: 'Mensile',
      annual: 'Annuale',
      free: 'Gratis',
      startFree: 'Inizia gratis',
      choose: 'Scegli',
      footer: 'Tutti i piani includono accesso a ItaliantoApp e Dialogue Studio. Nessun costo nascosto. Cancella in qualsiasi momento.',
      perMonth: '/mese',
      perYear: '/anno',
      approxPerMonth: '/mese',
      popular: 'Più popolare',
      allIncluded: 'Tutto incluso',
      tutor: 'Tutor AI',
      audio: 'Audio generato',
      plans: {
        free: {
          description: 'Per iniziare a esplorare',
          features: ['Traduttore base (es ↔ it)', 'Coniugatore di 20 verbi', 'Pratica di pronuncia', '3 dialoghi scritti/mese', 'Assistente ItalianBot', 'Video e contenuto base'],
        },
        essenziale: {
          description: 'Per apprendimento attivo',
          features: ['Tutto il gratuito', '30 min Tutor AI/mese', '20 dialoghi scritti/mese', '5 audio generati/mese', 'Accesso alle lezioni base', 'Supporto via email'],
        },
        avanzato: {
          description: 'Per parlare con scioltezza',
          features: ["Tutto l'essenziale", '60 min Tutor AI/mese', '80 dialoghi scritti/mese', '30 audio generati/mese', 'Corsi dal vivo con sconto', 'Supporto prioritario'],
        },
        maestro: {
          description: "Per l'immersione totale",
          features: ["Tutto l'avanzato", 'Tutor AI illimitato', 'Dialoghi illimitati', 'Audio illimitati', 'Corsi dal vivo inclusi', 'Accesso anticipato alle nuove funzionalità', 'Account manager dedicato'],
        },
      },
    },
    social: {
      badge: 'Comunità',
      title: 'Unisciti alla comunità',
      subtitle: 'Contenuto gratuito ogni giorno sui nostri social. Frasi, pronuncia, cultura italiana e consigli per accelerare il tuo apprendimento.',
      youtube: { description: 'Lezioni video, pronuncia e cultura italiana.', cta: 'Vedi canale' },
      instagram: { description: 'Frase del giorno, vocabolario e snippet culturali.', cta: 'Segui' },
      followers: 'follower',
      ctaTitle: 'Pronto a parlare italiano?',
      ctaSub: 'Registrati gratis. Senza carta di credito.',
      ctaBtn: 'Inizia gratis →',
    },
    contact: {
      badge: 'Contatti',
      title: 'Scrivici',
      subtitle: 'Abbiamo una risposta per ogni domanda. Ti rispondiamo entro 24 ore.',
      name: 'Il tuo nome',
      email: 'La tua email',
      phone: 'Telefono (opzionale)',
      message: 'Il tuo messaggio',
      send: 'Invia messaggio',
      sending: 'Invio in corso...',
      success: 'Messaggio inviato! Ti risponderemo presto.',
      error: "Si è verificato un errore. Per favore riprova.",
    },
    footer: {
      tagline: "La piattaforma completa per imparare l'italiano con intelligenza artificiale. Traduzione, pratica, dialoghi e tutor AI in un unico posto.",
      love: "Fatto con amore per l'italiano",
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
    features: {
      badge: 'Features',
      title1: 'Everything you need',
      title2: 'for Italian',
      subtitle: 'A complete ecosystem of AI-powered educational tools so you can learn at your own pace, in your language, from any device.',
      cards: {
        translator: { title: 'Smart Translator', description: 'Translate between Spanish, English and Italian with an 800+ word dictionary. History and favorites included.' },
        conjugator: { title: 'Complete Conjugator', description: '50+ verbs with 6 tenses. Integrated audio pronunciation.' },
        pronunciation: { title: 'Pronunciation Practice', description: 'Real-time voice recognition. Accurate scoring and instant feedback.' },
        dialogues: { title: 'AI Dialogues', description: 'Generate authentic Italian dialogues by context or translate conversations. Output as text or MP3 with unique voices per character.' },
        tutor: { title: 'AI Conversational Tutor', description: 'Practice real conversations with an AI tutor that corrects your grammar in real time.' },
        videos: { title: 'Videos & Lessons', description: 'Multimedia content library: vowels, consonants, months, seasons and more.' },
        songs: { title: 'Italian Songs', description: 'Learn vocabulary and pronunciation through Italian music.' },
        games: { title: 'Educational Games', description: 'Reinforce what you learned with minigames designed for vocabulary retention.' },
      },
      tags: { soon: 'Coming soon', platform: 'Platform' },
    },
    apps: {
      badge: 'App Ecosystem',
      title1: 'Two powerful tools,',
      title2: 'one subscription',
      subtitle: 'With your Italianto account you access the entire ecosystem. Mobile, web, desktop — your learning has no device limits.',
      app1: {
        tag: 'Mobile App + PWA',
        subtitle: 'Your Italian companion in your pocket',
        description: 'The complete mobile app for learning Italian. Available on Android, iOS and as a Progressive Web App (PWA). Learn offline.',
        features: [
          'Two-way translator (ES/EN ↔ IT)',
          'Conjugator for 50+ verbs',
          'AI pronunciation practice',
          'AI conversational tutor',
        ],
        cta: 'Use the app',
      },
      app2: {
        tag: 'Web App',
        subtitle: 'Create Italian dialogues with AI',
        description: 'Generate or translate dialogues into Italian with multiple characters. Export as text or MP3 audio with natural voices. Perfect for practicing real conversations.',
        features: [
          'Context-based dialogue generation',
          'Italian translation (ES/EN)',
          'MP3 audio with natural voices',
          'TXT/PDF file upload support',
        ],
        cta: 'Open Studio',
      },
    },
    pricing: {
      badge: 'Pricing',
      title1: 'Choose your plan,',
      title2: 'start today',
      subtitle: 'Start for free and upgrade when you need. No contracts, cancel anytime.',
      monthly: 'Monthly',
      annual: 'Annual',
      free: 'Free',
      startFree: 'Start for free',
      choose: 'Choose',
      footer: 'All plans include access to ItaliantoApp and Dialogue Studio. No hidden fees. Cancel anytime.',
      perMonth: '/mo',
      perYear: '/yr',
      approxPerMonth: '/mo',
      popular: 'Most popular',
      allIncluded: 'All included',
      tutor: 'AI Tutor',
      audio: 'Generated audio',
      plans: {
        free: {
          description: 'To start exploring',
          features: ['Basic translator (es ↔ it)', '20-verb conjugator', 'Pronunciation practice', '3 written dialogues/mo', 'ItalianBot assistant', 'Videos and basic content'],
        },
        essenziale: {
          description: 'For active learning',
          features: ['Everything in free', '30 min AI Tutor/mo', '20 written dialogues/mo', '5 generated audios/mo', 'Access to basic lessons', 'Email support'],
        },
        avanzato: {
          description: 'To speak fluently',
          features: ['Everything in essential', '60 min AI Tutor/mo', '80 written dialogues/mo', '30 generated audios/mo', 'Live courses at a discount', 'Priority support'],
        },
        maestro: {
          description: 'For total immersion',
          features: ['Everything in advanced', 'Unlimited AI Tutor', 'Unlimited dialogues', 'Unlimited audios', 'Live courses included', 'Early access to new features', 'Dedicated account manager'],
        },
      },
    },
    social: {
      badge: 'Community',
      title: 'Join the community',
      subtitle: 'Free content daily on our social media. Phrases, pronunciation, Italian culture and tips to accelerate your learning.',
      youtube: { description: 'Video lessons, pronunciation and Italian culture.', cta: 'See channel' },
      instagram: { description: 'Daily phrase, vocabulary and cultural snippets.', cta: 'Follow' },
      followers: 'followers',
      ctaTitle: 'Ready to speak Italian?',
      ctaSub: 'Sign up for free. No credit card.',
      ctaBtn: 'Start for free →',
    },
    contact: {
      badge: 'Contact',
      title: 'Write to us',
      subtitle: 'We have an answer for every question. We reply within 24 hours.',
      name: 'Your name',
      email: 'Your email',
      phone: 'Phone (optional)',
      message: 'Your message',
      send: 'Send message',
      sending: 'Sending...',
      success: 'Message sent! We will get back to you soon.',
      error: 'There was an error sending. Please try again.',
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
