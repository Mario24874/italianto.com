import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { notifyAdmin } from '@/lib/admin-notifications'
import { sendManualPaymentApprovedEmail } from '@/lib/payment-emails'

/**
 * POST /api/gift-cards/redeem — requiere cuenta (el plan se activa en ella).
 * Body: { code: string }
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'auth' }, { status: 401 })
  }

  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const code = body.code?.trim().toUpperCase().replace(/\s+/g, '')
  if (!code || !/^ITAL-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: card } = await supabase
    .from('gift_cards')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (!card || card.status === 'pending') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (card.status === 'redeemed') {
    return NextResponse.json({ error: 'already_redeemed' }, { status: 409 })
  }
  if (card.status === 'expired' || (card.expires_at && new Date(card.expires_at) < new Date())) {
    return NextResponse.json({ error: 'expired' }, { status: 410 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  // Activar/extender: si ya hay una sub de regalo o manual vigente, suma al final
  const now = new Date()
  const nowISO = now.toISOString()
  const giftSubId = `gift_${userId}`
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('current_period_end, status')
    .eq('id', giftSubId)
    .maybeSingle()

  const base =
    existing?.status === 'active' &&
    existing.current_period_end &&
    new Date(existing.current_period_end) > now
      ? new Date(existing.current_period_end)
      : now
  const periodEnd = new Date(base)
  periodEnd.setMonth(periodEnd.getMonth() + card.months)

  // Marcar canjeada ANTES de activar, con guard sobre status, para que dos
  // canjes simultáneos del mismo código no activen el plan dos veces.
  const { data: claimed, error: claimError } = await supabase
    .from('gift_cards')
    .update({
      status: 'redeemed',
      redeemed_by: userId,
      redeemed_at: nowISO,
      updated_at: nowISO,
    })
    .eq('id', card.id)
    .eq('status', 'active')
    .select('id')
  if (claimError || !claimed || claimed.length === 0) {
    return NextResponse.json({ error: 'already_redeemed' }, { status: 409 })
  }

  const { error: subError } = await supabase.from('subscriptions').upsert({
    id: giftSubId,
    user_id: userId,
    status: 'active',
    plan_type: card.plan_type,
    price_id: null,
    billing_interval: card.months === 12 ? 'year' : 'month',
    amount: Math.round(Number(card.amount_usd) * 100),
    currency: 'usd',
    current_period_start: nowISO,
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
    canceled_at: null,
    updated_at: nowISO,
  })
  if (subError) {
    // Revertir el canje para que el usuario pueda reintentar
    await supabase
      .from('gift_cards')
      .update({ status: 'active', redeemed_by: null, redeemed_at: null, updated_at: nowISO })
      .eq('id', card.id)
    console.error('[gift-cards/redeem] subscription error:', subError.message)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  await supabase
    .from('users')
    .update({ plan_type: card.plan_type, updated_at: nowISO })
    .eq('id', userId)

  if (user?.email) {
    sendManualPaymentApprovedEmail({
      to: user.email,
      name: user.full_name,
      planType: card.plan_type,
      periodEnd: periodEnd.toISOString(),
    }).catch(err => console.warn('[gift-cards/redeem] email failed:', err))
  }

  notifyAdmin({
    type: 'gift_card_redeemed',
    title: 'Gift card canjeada',
    message: `${user?.email ?? userId} canjeó ${card.code} — ${card.plan_type} x${card.months} meses`,
    metadata: { code: card.code, user_id: userId, plan: card.plan_type, months: card.months },
    emailSubject: `[Italianto] 🎁 Gift card canjeada — ${user?.email ?? userId}`,
    emailRows: [
      ['Código', card.code],
      ['Canjeada por', user?.email ?? userId],
      ['Plan', `${card.plan_type} (${card.months} meses)`],
      ['Comprada por', card.buyer_email],
    ],
  }).catch(err => console.warn('[gift-cards/redeem] notifyAdmin failed:', err))

  return NextResponse.json({
    ok: true,
    planType: card.plan_type,
    months: card.months,
    periodEnd: periodEnd.toISOString(),
  })
}
