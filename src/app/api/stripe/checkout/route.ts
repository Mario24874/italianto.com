import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe, getPlanById } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType, BillingInterval } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { planType, billingInterval }: { planType: PlanType; billingInterval: BillingInterval } = body

  const plan = getPlanById(planType)
  if (!plan || planType === 'free') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const priceId =
    billingInterval === 'year' ? plan.annualPriceId : plan.monthlyPriceId

  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 500 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: user } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single()

    let customerId = user?.stripe_customer_id

    if (!customerId && user?.email) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      })
      customerId = customer.id
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://italianto.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/precios?canceled=true`,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Checkout error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
