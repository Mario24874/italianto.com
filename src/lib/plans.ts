// Plan data — safe to import on client AND server (no Stripe dependency)

export type PlanType = 'free' | 'essenziale' | 'avanzato' | 'maestro'
export type BillingInterval = 'month' | 'year'

export interface Plan {
  id: PlanType
  name: string
  nameIt: string
  description: string
  monthlyPrice: number
  annualPrice: number
  monthlyPriceId: string
  annualPriceId: string
  features: string[]
  limits: {
    tutorMinutes: number | null
    dialogues: number | null
    audio: number | null
  }
  highlighted: boolean
  badge?: string
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    nameIt: 'Gratuito',
    description: 'Para empezar a explorar',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyPriceId: '',
    annualPriceId: '',
    features: [
      'Traductor básico (es ↔ it)',
      'Conjugador de 20 verbos',
      'Práctica de pronunciación',
      '3 diálogos escritos/mes',
      'ItalianBot asistente',
      'Videos y contenido básico',
    ],
    limits: { tutorMinutes: 0, dialogues: 3, audio: 0 },
    highlighted: false,
  },
  {
    id: 'essenziale',
    name: 'Esencial',
    nameIt: 'Essenziale',
    description: 'Para aprendizaje activo',
    monthlyPrice: 12,
    annualPrice: 96,
    monthlyPriceId: process.env.STRIPE_PRICE_ESSENZIALE_MONTHLY || '',
    annualPriceId: process.env.STRIPE_PRICE_ESSENZIALE_YEARLY || '',
    features: [
      'Todo lo gratuito',
      '30 min Tutor AI/mes',
      '20 diálogos escritos/mes',
      '5 audios generados/mes',
      'Acceso a lecciones básicas',
      'Soporte por email',
    ],
    limits: { tutorMinutes: 30, dialogues: 20, audio: 5 },
    highlighted: false,
  },
  {
    id: 'avanzato',
    name: 'Avanzado',
    nameIt: 'Avanzato',
    description: 'Para hablar con fluidez',
    monthlyPrice: 29,
    annualPrice: 232,
    monthlyPriceId: process.env.STRIPE_PRICE_AVANZATO_MONTHLY || '',
    annualPriceId: process.env.STRIPE_PRICE_AVANZATO_YEARLY || '',
    features: [
      'Todo lo esencial',
      '60 min Tutor AI/mes',
      '80 diálogos escritos/mes',
      '30 audios generados/mes',
      'Cursos en vivo con descuento',
      'Soporte prioritario',
    ],
    limits: { tutorMinutes: 60, dialogues: 80, audio: 30 },
    highlighted: true,
    badge: 'Más popular',
  },
  {
    id: 'maestro',
    name: 'Maestro',
    nameIt: 'Maestro',
    description: 'Para la inmersión total',
    monthlyPrice: 79,
    annualPrice: 632,
    monthlyPriceId: process.env.STRIPE_PRICE_MAESTRO_MONTHLY || '',
    annualPriceId: process.env.STRIPE_PRICE_MAESTRO_YEARLY || '',
    features: [
      'Todo lo avanzado',
      'Tutor AI ilimitado',
      'Diálogos ilimitados',
      'Audios ilimitados',
      'Cursos en vivo incluidos',
      'Acceso anticipado a nuevas features',
      'Manager de cuenta dedicado',
    ],
    limits: { tutorMinutes: null, dialogues: null, audio: null },
    highlighted: false,
    badge: 'Todo incluido',
  },
]

export function getPlanById(planId: PlanType): Plan | undefined {
  return PLANS.find(p => p.id === planId)
}

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find(
    p => p.monthlyPriceId === priceId || p.annualPriceId === priceId
  )
}
