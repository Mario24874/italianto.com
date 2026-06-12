import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { notifyAdmin } from '@/lib/admin-notifications'
import { sendPaymentFailedEmail } from '@/lib/payment-emails'
import type Stripe from 'stripe'
import type { PlanType, SubscriptionStatus } from '@/types'

// El id de suscripción puede venir en invoice.subscription (API clásica) o en
// invoice.parent.subscription_details (API 2025+), según la versión del evento.
function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const direct = inv.subscription
  if (typeof direct === 'string') return direct
  if (direct && typeof direct === 'object') return direct.id
  const parent = (inv as unknown as {
    parent?: { subscription_details?: { subscription?: string | { id: string } } }
  }).parent
  const nested = parent?.subscription_details?.subscription
  if (typeof nested === 'string') return nested
  if (nested && typeof nested === 'object') return nested.id
  return null
}

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

      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const customerId = inv.customer as string | null
        const subscriptionId = invoiceSubscriptionId(inv)
        const failureType =
          inv.billing_reason === 'subscription_create' ? 'initial' : 'renewal'

        // Datos del usuario y su plan para enriquecer el registro
        const { data: user } = customerId
          ? await supabase
              .from('users')
              .select('id, email, full_name, plan_type')
              .eq('stripe_customer_id', customerId)
              .maybeSingle()
          : { data: null }

        const email = inv.customer_email || user?.email || null
        const lastError =
          (inv as unknown as { last_finalization_error?: { message?: string } })
            .last_finalization_error?.message || null

        await supabase.from('payment_failures').upsert(
          {
            source: 'stripe',
            stripe_invoice_id: inv.id,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            user_id: user?.id ?? null,
            email,
            plan_type: user?.plan_type ?? null,
            amount: inv.amount_due,
            currency: inv.currency,
            failure_type: failureType,
            failure_message: lastError,
            attempt_count: inv.attempt_count,
            next_retry_at: toISO(inv.next_payment_attempt),
            status: 'open',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_invoice_id' }
        )

        const amountDisplay = `$${(inv.amount_due / 100).toFixed(2)} ${inv.currency.toUpperCase()}`
        notifyAdmin({
          type: 'payment_failed',
          severity: 'warning',
          title: `Fallo de cobro ${failureType === 'initial' ? 'inicial' : 'de renovación'}`,
          message: `${email ?? customerId} — ${amountDisplay} (intento ${inv.attempt_count})`,
          metadata: { invoice_id: inv.id, subscription_id: subscriptionId, email, attempt: inv.attempt_count },
          emailSubject: `[Italianto] ⚠️ Fallo de cobro — ${email ?? customerId}`,
          emailRows: [
            ['Email', email ?? '—'],
            ['Tipo', failureType === 'initial' ? 'Suscripción inicial' : 'Renovación'],
            ['Monto', amountDisplay],
            ['Intento', String(inv.attempt_count)],
            ['Próximo reintento', inv.next_payment_attempt ? new Date(inv.next_payment_attempt * 1000).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : '—'],
          ],
        }).catch(err => console.warn('[stripe-webhook] notifyAdmin failed:', err))

        // Avisar al cliente solo en el primer intento para no hacer spam:
        // Stripe reintenta solo y cada reintento dispara este evento de nuevo.
        if (email && inv.attempt_count <= 1) {
          sendPaymentFailedEmail({
            to: email,
            name: user?.full_name ?? null,
            planType: user?.plan_type ?? 'essenziale',
            isRenewal: failureType === 'renewal',
          }).catch(err => console.warn('[stripe-webhook] payment failed email error:', err))
        }
        break
      }

      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice
        const subscriptionId = invoiceSubscriptionId(inv)
        // Recuperado: cerrar fallos abiertos de esta factura o de su suscripción
        const orFilter = subscriptionId
          ? `stripe_invoice_id.eq.${inv.id},stripe_subscription_id.eq.${subscriptionId}`
          : `stripe_invoice_id.eq.${inv.id}`
        await supabase
          .from('payment_failures')
          .update({
            status: 'recovered',
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('status', 'open')
          .or(orFilter)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Gift card comprada (pago único, sin cuenta): activar y enviar emails
        if (session.mode === 'payment' && session.metadata?.giftCardId) {
          const giftCardId = session.metadata.giftCardId
          const paidAt = new Date()
          const expiresAt = new Date(paidAt)
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)

          // Guard sobre status pending: el webhook puede llegar duplicado
          const { data: activated } = await supabase
            .from('gift_cards')
            .update({
              status: 'active',
              paid_at: paidAt.toISOString(),
              expires_at: expiresAt.toISOString(),
              updated_at: paidAt.toISOString(),
            })
            .eq('id', giftCardId)
            .eq('status', 'pending')
            .select('*')

          const card = activated?.[0]
          if (card) {
            const { sendGiftCardToRecipient, sendGiftCardReceipt } = await import('@/lib/gift-emails')
            const emailData = {
              code: card.code,
              planType: card.plan_type,
              months: card.months,
              buyerEmail: card.buyer_email,
              buyerName: card.buyer_name,
              recipientEmail: card.recipient_email,
              recipientName: card.recipient_name,
              message: card.message,
              lang: card.lang,
              expiresAt: card.expires_at,
            }
            sendGiftCardReceipt(emailData).catch(err => console.warn('[stripe-webhook] gift receipt email failed:', err))
            sendGiftCardToRecipient(emailData).catch(err => console.warn('[stripe-webhook] gift recipient email failed:', err))

            notifyAdmin({
              type: 'gift_card_sold',
              title: 'Gift card vendida',
              message: `${card.buyer_email} compró ${card.plan_type} x${card.months} meses ($${card.amount_usd})`,
              metadata: { gift_card_id: card.id, code: card.code, buyer: card.buyer_email },
              emailSubject: `[Italianto] 🎁 Gift card vendida — $${card.amount_usd} (${card.buyer_email})`,
              emailRows: [
                ['Comprador', card.buyer_email],
                ['Destinatario', card.recipient_email ?? '(el mismo comprador)'],
                ['Plan', `${card.plan_type} (${card.months} meses)`],
                ['Monto', `$${card.amount_usd} USD`],
                ['Código', card.code],
              ],
            }).catch(err => console.warn('[stripe-webhook] notifyAdmin failed:', err))
          }
          break
        }

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

          const planLabels: Record<string, string> = { essenziale: 'Essenziale', avanzato: 'Avanzato', maestro: 'Maestro' }
          const planLabel = planLabels[planType] ?? planType
          const billingInterval = sub.items.data[0]?.price.recurring?.interval || 'month'
          const amount = sub.items.data[0]?.price.unit_amount || 0
          const amountDisplay = `$${(amount / 100).toFixed(2)} ${sub.currency.toUpperCase()}`
          const now = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })

          notifyAdmin({
            type: 'new_subscription',
            title: `Nueva suscripción ${planLabel}`,
            message: `${email} se suscribió al plan ${planLabel} (${amountDisplay})`,
            metadata: { email, plan: planType, amount, subscription_id: sub.id, user_id: userId },
            emailSubject: `[Italianto] 🎉 Nueva suscripción — ${planLabel} (${email})`,
            emailRows: [
              ['Email', email],
              ['Plan', planLabel],
              ['Monto', amountDisplay],
              ['Período', billingInterval === 'year' ? 'Anual' : 'Mensual'],
              ['Fecha', now],
            ],
          }).catch(err => console.warn('[stripe-webhook] notifyAdmin failed:', err))
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
