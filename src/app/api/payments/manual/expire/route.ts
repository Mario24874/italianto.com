import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { notifyAdmin } from '@/lib/admin-notifications'
import { sendManualRenewalReminderEmail } from '@/lib/payment-emails'

/**
 * POST /api/payments/manual/expire
 *
 * Cobranza de suscripciones manuales (Pago Móvil/Zelle), que no se renuevan solas.
 * Llamar 1 vez al día via cron-job.org:
 *   Schedule: 0 9 * * *  (09:00 UTC diario)
 *   Header:   Authorization: Bearer <CRON_SECRET>
 *
 * - Vencen en 2-3 días → email de recordatorio de renovación (la ventana de 1 día
 *   garantiza un solo aviso con cron diario).
 * - Ya vencidas → status canceled, plan_type free (si no hay otra sub activa),
 *   registro en payment_failures y aviso al admin.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()
  const in2d = new Date(now.getTime() + 2 * 86400_000).toISOString()
  const in3d = new Date(now.getTime() + 3 * 86400_000).toISOString()
  const nowISO = now.toISOString()

  let reminded = 0
  let expired = 0

  // 1. Recordatorios de renovación (vencen entre 2 y 3 días)
  // Cubre suscripciones manuales (Pago Móvil/Zelle) y de gift cards canjeadas
  const { data: expiring } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_type, current_period_end')
    .or('id.like.manual_%,id.like.gift_%')
    .eq('status', 'active')
    .gt('current_period_end', in2d)
    .lte('current_period_end', in3d)

  for (const sub of expiring ?? []) {
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', sub.user_id)
      .single()
    if (!user?.email) continue
    await sendManualRenewalReminderEmail({
      to: user.email,
      name: user.full_name,
      planType: sub.plan_type,
      periodEnd: sub.current_period_end,
    }).catch(err => console.warn('[manual/expire] reminder failed:', err))
    reminded++
  }

  // 2. Suscripciones manuales o de regalo vencidas
  const { data: overdue } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_type, billing_interval, amount, current_period_end')
    .or('id.like.manual_%,id.like.gift_%')
    .eq('status', 'active')
    .lt('current_period_end', nowISO)

  for (const sub of overdue ?? []) {
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', canceled_at: nowISO, updated_at: nowISO })
      .eq('id', sub.id)

    // Solo degradar a free si no le queda otra suscripción activa (p. ej. Stripe)
    const { data: otherActive } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', sub.user_id)
      .eq('status', 'active')
      .gt('current_period_end', nowISO)
      .limit(1)
      .maybeSingle()

    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', sub.user_id)
      .single()

    if (!otherActive) {
      await supabase
        .from('users')
        .update({ plan_type: 'free', updated_at: nowISO })
        .eq('id', sub.user_id)
    }

    await supabase.from('payment_failures').insert({
      source: 'manual',
      user_id: sub.user_id,
      email: user?.email ?? null,
      plan_type: sub.plan_type,
      billing_interval: sub.billing_interval,
      amount: sub.amount,
      currency: 'usd',
      failure_type: 'renewal',
      failure_message: 'Suscripción manual vencida sin renovación reportada',
      status: 'open',
    })

    notifyAdmin({
      type: 'manual_subscription_expired',
      severity: 'warning',
      title: 'Suscripción manual vencida',
      message: `${user?.email ?? sub.user_id} — plan ${sub.plan_type} venció sin renovar`,
      metadata: { user_id: sub.user_id, plan: sub.plan_type },
      emailSubject: `[Italianto] ⏰ Suscripción manual vencida — ${user?.email ?? sub.user_id}`,
      emailRows: [
        ['Email', user?.email ?? '—'],
        ['Plan', sub.plan_type],
        ['Venció', new Date(sub.current_period_end).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })],
      ],
    }).catch(err => console.warn('[manual/expire] notifyAdmin failed:', err))
    expired++
  }

  return NextResponse.json({ ok: true, reminded, expired })
}
