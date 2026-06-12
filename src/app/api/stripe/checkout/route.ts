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

  const body = await req.json() as { planType: PlanType; billingInterval: BillingInterval; promoCode?: string }
  const { planType, billingInterval, promoCode } = body

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

    // Verify the stored customer still exists in Stripe (e.g. after switching test→live)
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
      } catch {
        customerId = null
        await supabase
          .from('users')
          .update({ stripe_customer_id: null })
          .eq('id', userId)
      }
    }

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

    // Apply launch discount when LANCIO10 is requested. We use the coupon ID directly
    // (not a promotion code) because promotionCodes.create() is broken in Stripe API
    // 2025-12-15.clover (parameter rename). The coupon is created via
    // POST /api/admin/init-launch-coupon and its ID stored as STRIPE_LANCIO10_COUPON_ID.
    // Stripe coupons' redeem_by is immutable: extending the campaign means a NEW coupon,
    // so if the env var points to an expired one we fall back to the valid campaign
    // coupon (metadata.campaign === 'lancio-2026') instead of failing the checkout.
    let discounts: { coupon: string }[] | undefined
    if (promoCode?.toUpperCase() === 'LANCIO10') {
      const now = Date.now()
      const launchEnd = new Date('2026-06-30T23:59:59Z').getTime()
      if (now <= launchEnd) {
        let couponId = process.env.STRIPE_LANCIO10_COUPON_ID || null
        if (couponId) {
          try {
            const coupon = await stripe.coupons.retrieve(couponId)
            if (!coupon.valid) couponId = null
          } catch {
            couponId = null
          }
        }
        if (!couponId) {
          const coupons = await stripe.coupons.list({ limit: 20 })
          couponId = coupons.data.find(
            c => c.metadata?.campaign === 'lancio-2026' && c.valid
          )?.id ?? null
        }
        if (couponId) {
          discounts = [{ coupon: couponId }]
        } else {
          console.error('LANCIO10 requested but no valid lancio-2026 coupon found in Stripe')
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/precios?canceled=true`,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Checkout error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
