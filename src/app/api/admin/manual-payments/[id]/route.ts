import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  sendManualPaymentApprovedEmail,
  sendManualPaymentRejectedEmail,
} from '@/lib/payment-emails'

/**
 * POST /api/admin/manual-payments/[id]
 * Body: { action: 'approve' | 'reject', adminNote?: string }
 *
 * approve → activa/extiende el plan en subscriptions (id manual_<userId>),
 *           actualiza users.plan_type y envía email de confirmación.
 * reject  → marca rechazado y envía email con el motivo.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  let body: { action?: string; adminNote?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.action !== 'approve' && body.action !== 'reject') {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: payment } = await supabase
    .from('manual_payments')
    .select('*')
    .eq('id', id)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
  }
  if (payment.status !== 'pending') {
    return NextResponse.json({ error: `El pago ya fue ${payment.status === 'approved' ? 'aprobado' : 'rechazado'}` }, { status: 409 })
  }

  const admin = await currentUser()
  const adminEmail =
    admin?.emailAddresses.find(e => e.id === admin.primaryEmailAddressId)?.emailAddress ?? 'admin'
  const nowISO = new Date().toISOString()

  if (body.action === 'reject') {
    const { error } = await supabase
      .from('manual_payments')
      .update({
        status: 'rejected',
        admin_note: body.adminNote?.trim() || null,
        reviewed_at: nowISO,
        reviewed_by: adminEmail,
        updated_at: nowISO,
      })
      .eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    sendManualPaymentRejectedEmail({
      to: payment.email,
      name: payment.full_name,
      planType: payment.plan_type,
      adminNote: body.adminNote?.trim() || null,
    }).catch(err => console.warn('[manual-payments] reject email failed:', err))

    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // ── Aprobar: activar o extender el plan ────────────────────────────────────
  // Si ya hay una suscripción manual vigente, la extensión arranca donde termina.
  const manualSubId = `manual_${payment.user_id}`
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('current_period_end, status')
    .eq('id', manualSubId)
    .maybeSingle()

  const now = new Date()
  const base =
    existing?.status === 'active' &&
    existing.current_period_end &&
    new Date(existing.current_period_end) > now
      ? new Date(existing.current_period_end)
      : now

  const periodEnd = new Date(base)
  if (payment.billing_interval === 'year') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  const { error: subError } = await supabase.from('subscriptions').upsert({
    id: manualSubId,
    user_id: payment.user_id,
    status: 'active',
    plan_type: payment.plan_type,
    price_id: null,
    billing_interval: payment.billing_interval,
    amount: Math.round(Number(payment.amount_usd ?? 0) * 100),
    currency: 'usd',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
    canceled_at: null,
    updated_at: nowISO,
  })
  if (subError) {
    return NextResponse.json({ error: `Error activando suscripción: ${subError.message}` }, { status: 500 })
  }

  await supabase
    .from('users')
    .update({ plan_type: payment.plan_type, updated_at: nowISO })
    .eq('id', payment.user_id)

  const { error: payError } = await supabase
    .from('manual_payments')
    .update({
      status: 'approved',
      admin_note: body.adminNote?.trim() || null,
      reviewed_at: nowISO,
      reviewed_by: adminEmail,
      updated_at: nowISO,
    })
    .eq('id', id)
  if (payError) {
    return NextResponse.json({ error: payError.message }, { status: 500 })
  }

  sendManualPaymentApprovedEmail({
    to: payment.email,
    name: payment.full_name,
    planType: payment.plan_type,
    periodEnd: periodEnd.toISOString(),
  }).catch(err => console.warn('[manual-payments] approve email failed:', err))

  return NextResponse.json({
    ok: true,
    status: 'approved',
    periodEnd: periodEnd.toISOString(),
  })
}
