import Stripe from 'stripe'

// Re-export plan data for convenience (backwards compatibility)
export type { PlanType, BillingInterval, Plan } from './plans'
export { PLANS, getPlanById, getPlanByPriceId } from './plans'

// Lazy Stripe client — only instantiated on first request, not at build time
// This prevents build failures when STRIPE_SECRET_KEY is a runtime-only env var
let _stripe: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return _stripe
}

// Keep named export for backwards compatibility with existing imports
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripeClient()[prop as keyof Stripe]
  },
})
