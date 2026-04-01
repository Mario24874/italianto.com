import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import type Stripe from 'stripe'
import type { PlanType, SubscriptionStatus } from '@/types'

const toISO = (ts: number | null | undefined): string | null =>
  ts ? new Date(ts * 1000).toISOString() : null

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Stripe webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        const productId = sub.items.data[0]?.price.product as string

        // Determinar plan
        let planType: PlanType = 'essenziale'
        if (productId === process.env.STRIPE_PRODUCT_AVANZATO) planType = 'avanzato'
        if (productId === process.env.STRIPE_PRODUCT_MAESTRO) planType = 'maestro'

        const billingInterval = sub.items.data[0]?.price.recurring?.interval || 'month'
        const amount = sub.items.data[0]?.price.unit_amount || 0
        const userId = sub.metadata?.userId

        await supabase.from('subscriptions').upsert({
          id: sub.id,
          user_id: userId || sub.customer as string,
          status: sub.status as SubscriptionStatus,
          plan_type: planType,
          price_id: priceId,
          billing_interval: billingInterval,
          amount,
          currency: sub.currency,
          current_period_start: toISO(sub.current_period_start),
          current_period_end: toISO(sub.current_period_end),
          cancel_at_period_end: sub.cancel_at_period_end,
          canceled_at: toISO(sub.canceled_at),
          updated_at: new Date().toISOString(),
        })

        // Actualizar plan del usuario — preferir userId del metadata (más confiable)
        if (userId) {
          await supabase
            .from('users')
            .update({ plan_type: planType, stripe_customer_id: sub.customer as string, updated_at: new Date().toISOString() })
            .eq('id', userId)
        } else {
          await supabase
            .from('users')
            .update({ plan_type: planType, updated_at: new Date().toISOString() })
            .eq('stripe_customer_id', sub.customer)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('id', sub.id)

        await supabase
          .from('users')
          .update({ plan_type: 'free', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', sub.customer)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription && session.metadata?.userId) {
          const userId = session.metadata.userId
          const email = session.customer_details?.email || ''
          const fullName = session.customer_details?.name || null

          // Obtener suscripción para determinar plan_type
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          const productId = sub.items.data[0]?.price.product as string
          let planType: PlanType = 'essenziale'
          if (productId === process.env.STRIPE_PRODUCT_AVANZATO) planType = 'avanzato'
          if (productId === process.env.STRIPE_PRODUCT_MAESTRO) planType = 'maestro'

          // Upsert usuario — lo crea si no existe (Clerk webhook puede no haberse configurado aún)
          await supabase.from('users').upsert({
            id: userId,
            email,
            full_name: fullName,
            stripe_customer_id: session.customer as string,
            plan_type: planType,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })

          // Upsert suscripción
          await supabase.from('subscriptions').upsert({
            id: sub.id,
            user_id: userId,
            status: sub.status as SubscriptionStatus,
            plan_type: planType,
            price_id: sub.items.data[0]?.price.id,
            billing_interval: sub.items.data[0]?.price.recurring?.interval || 'month',
            amount: sub.items.data[0]?.price.unit_amount || 0,
            currency: sub.currency,
            current_period_start: toISO(sub.current_period_start),
            current_period_end: toISO(sub.current_period_end),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
