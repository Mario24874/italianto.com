import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { stripe } from '@/lib/stripe'

// NOTE: stripe.promotionCodes.create({ coupon }) fails in API 2025-12-15.clover
// (parameter renamed in that version). We create the coupon directly and apply
// it in checkout via discounts[{ coupon }] — no promotion code object needed.
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    // Check if coupon already exists (idempotent)
    const existing = await stripe.coupons.list({ limit: 20 })
    const found = existing.data.find(
      c => c.metadata?.campaign === 'lancio-2026' && c.valid
    )
    if (found) {
      return NextResponse.json({
        ok: true,
        message: 'Cupón ya existe',
        couponId: found.id,
        instruction: `Agrega en Easypanel: STRIPE_LANCIO10_COUPON_ID=${found.id}`,
      })
    }

    const coupon = await stripe.coupons.create({
      name: 'Lanzamiento 10% — LANCIO10',
      percent_off: 10,
      duration: 'once',
      redeem_by: Math.floor(new Date('2026-06-30T23:59:59Z').getTime() / 1000),
      metadata: { created_by: 'launch-campaign', campaign: 'lancio-2026' },
    })

    return NextResponse.json({
      ok: true,
      couponId: coupon.id,
      instruction: `IMPORTANTE: Agrega en Easypanel → Variables de entorno: STRIPE_LANCIO10_COUPON_ID=${coupon.id}`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
