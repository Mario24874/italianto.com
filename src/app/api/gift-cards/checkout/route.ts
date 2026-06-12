import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generateGiftCode, giftPriceUsd, GIFT_PLAN_LABELS, GIFT_MONTHS, type GiftMonths } from '@/lib/gift-cards'
import type { PlanType } from '@/lib/plans'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * POST /api/gift-cards/checkout — PÚBLICO (no requiere cuenta).
 *
 * Crea la gift card en estado pending y una sesión de Stripe Checkout (pago único).
 * El webhook checkout.session.completed la activa y envía los emails con el código.
 */
export async function POST(req: NextRequest) {
  let body: {
    planType?: PlanType
    months?: number
    buyerEmail?: string
    buyerName?: string
    recipientEmail?: string
    recipientName?: string
    message?: string
    lang?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const months = body.months as GiftMonths
  if (!GIFT_MONTHS.includes(months)) {
    return NextResponse.json({ error: 'Duración inválida' }, { status: 400 })
  }
  const amountUsd = body.planType ? giftPriceUsd(body.planType, months) : null
  if (!body.planType || amountUsd == null) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }

  const buyerEmail = body.buyerEmail?.trim().toLowerCase()
  if (!buyerEmail || !EMAIL_RE.test(buyerEmail)) {
    return NextResponse.json({ error: 'Email del comprador inválido' }, { status: 400 })
  }
  const recipientEmail = body.recipientEmail?.trim().toLowerCase() || null
  if (recipientEmail && !EMAIL_RE.test(recipientEmail)) {
    return NextResponse.json({ error: 'Email del destinatario inválido' }, { status: 400 })
  }
  const message = body.message?.trim().slice(0, 300) || null
  const lang = body.lang === 'it' || body.lang === 'en' ? body.lang : 'es'

  const supabase = getSupabaseAdmin()
  const code = generateGiftCode()
  const planLabel = GIFT_PLAN_LABELS[body.planType]
  const monthsLabel = months === 12 ? '12 mesi / meses' : `${months} ${months === 1 ? 'mese/mes' : 'mesi/meses'}`

  const { data: card, error } = await supabase
    .from('gift_cards')
    .insert({
      code,
      plan_type: body.planType,
      months,
      amount_usd: amountUsd,
      buyer_email: buyerEmail,
      buyer_name: body.buyerName?.trim().slice(0, 80) || null,
      recipient_email: recipientEmail,
      recipient_name: body.recipientName?.trim().slice(0, 80) || null,
      message,
      lang,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[gift-cards/checkout] insert error:', error.message)
    return NextResponse.json({ error: 'Error al crear la gift card' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://italianto.com'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: buyerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amountUsd * 100),
            product_data: {
              name: `Gift Card Italianto — ${planLabel} (${monthsLabel})`,
              description: 'Tarjeta de regalo · Carta regalo · Gift card',
            },
          },
          quantity: 1,
        },
      ],
      metadata: { giftCardId: card.id },
      success_url: `${appUrl}/regalo?success=1`,
      cancel_url: `${appUrl}/regalo?canceled=1`,
    })

    await supabase
      .from('gift_cards')
      .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', card.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[gift-cards/checkout] stripe error:', msg)
    return NextResponse.json({ error: 'Error al crear el pago' }, { status: 500 })
  }
}
