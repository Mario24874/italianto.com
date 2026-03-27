import Stripe from 'stripe'

// Re-export plan data for convenience (backwards compatibility)
export type { PlanType, BillingInterval, Plan } from './plans'
export { PLANS, getPlanById, getPlanByPriceId } from './plans'

// Stripe client — server-side only (API routes, Server Components)
// Do NOT import this in client components
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})
