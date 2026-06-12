import { randomBytes } from 'crypto'
import { PLANS, type PlanType } from '@/lib/plans'

export type GiftMonths = 1 | 3 | 12
export const GIFT_MONTHS: GiftMonths[] = [1, 3, 12]

// Sin caracteres ambiguos (0/O, 1/I/L) para que el código se pueda dictar
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function generateGiftCode(): string {
  const bytes = randomBytes(12)
  const chars = Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length])
  return `ITAL-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}`
}

/** 1 mes = precio mensual · 3 meses = 3x mensual · 12 meses = precio anual (ya con descuento) */
export function giftPriceUsd(planType: PlanType, months: GiftMonths): number | null {
  const plan = PLANS.find(p => p.id === planType)
  if (!plan || planType === 'free') return null
  if (months === 12) return plan.annualPrice
  return plan.monthlyPrice * months
}

export const GIFT_PLAN_LABELS: Record<string, string> = {
  essenziale: 'Essenziale',
  avanzato: 'Avanzato',
  maestro: 'Maestro',
}
