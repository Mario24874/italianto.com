import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { notifyAdmin } from '@/lib/admin-notifications'
import { sendManualPaymentReceivedEmail } from '@/lib/payment-emails'
import { PLANS, type PlanType, type BillingInterval } from '@/lib/plans'

/**
 * POST /api/payments/manual
 *
 * El usuario (autenticado) reporta un pago hecho por Pago Móvil o Zelle.
 * Queda en estado pending hasta que el admin lo apruebe en /admin/cobranza.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    planType?: PlanType
    billingInterval?: BillingInterval
    method?: string
    reference?: string
    payerPhone?: string
    payerBank?: string
    note?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { planType, billingInterval, method, reference } = body
  const plan = PLANS.find(p => p.id === planType)
  if (!plan || planType === 'free') {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }
  if (billingInterval !== 'month' && billingInterval !== 'year') {
    return NextResponse.json({ error: 'Intervalo inválido' }, { status: 400 })
  }
  if (method !== 'pago_movil' && method !== 'zelle') {
    return NextResponse.json({ error: 'Método inválido' }, { status: 400 })
  }
  const cleanReference = reference?.trim()
  if (!cleanReference || cleanReference.length < 4 || cleanReference.length > 60) {
    return NextResponse.json(
      { error: 'Referencia de pago inválida (mínimo 4 caracteres)' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (!user?.email) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Evitar reportes duplicados con la misma referencia
  const { data: dup } = await supabase
    .from('manual_payments')
    .select('id')
    .eq('user_id', userId)
    .eq('reference', cleanReference)
    .in('status', ['pending', 'approved'])
    .maybeSingle()
  if (dup) {
    return NextResponse.json(
      { error: 'Ya existe un pago reportado con esa referencia' },
      { status: 409 }
    )
  }

  // ¿Es renovación? Tiene alguna suscripción activa vigente
  const { data: activeSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .limit(1)
    .maybeSingle()

  const amountUsd = billingInterval === 'year' ? plan.annualPrice : plan.monthlyPrice

  const { data: payment, error } = await supabase
    .from('manual_payments')
    .insert({
      user_id: userId,
      email: user.email,
      full_name: user.full_name,
      plan_type: planType,
      billing_interval: billingInterval,
      method,
      reference: cleanReference,
      amount_usd: amountUsd,
      payer_phone: body.payerPhone?.trim() || null,
      payer_bank: body.payerBank?.trim() || null,
      note: body.note?.trim() || null,
      kind: activeSub ? 'renewal' : 'initial',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[payments/manual] insert error:', error.message)
    return NextResponse.json({ error: 'Error al registrar el pago' }, { status: 500 })
  }

  const methodLabel = method === 'pago_movil' ? 'Pago Móvil' : 'Zelle'
  notifyAdmin({
    type: 'manual_payment_reported',
    severity: 'warning',
    title: 'Pago manual por verificar',
    message: `${user.email} reportó ${methodLabel} ref ${cleanReference} — ${plan.name} ${billingInterval === 'year' ? 'anual' : 'mensual'} ($${amountUsd})`,
    metadata: { payment_id: payment.id, user_id: userId, method, reference: cleanReference },
    emailSubject: `[Italianto] 💵 Pago manual por verificar — ${user.email}`,
    emailRows: [
      ['Email', user.email],
      ['Plan', `${plan.nameIt} (${billingInterval === 'year' ? 'anual' : 'mensual'})`],
      ['Monto', `$${amountUsd} USD`],
      ['Método', methodLabel],
      ['Referencia', cleanReference],
      ['Revisar', 'https://italianto.com/admin/cobranza'],
    ],
  }).catch(err => console.warn('[payments/manual] notifyAdmin failed:', err))

  sendManualPaymentReceivedEmail({
    to: user.email,
    name: user.full_name,
    planType: plan.id,
    method,
    reference: cleanReference,
  }).catch(err => console.warn('[payments/manual] receipt email failed:', err))

  return NextResponse.json({ ok: true, id: payment.id })
}
