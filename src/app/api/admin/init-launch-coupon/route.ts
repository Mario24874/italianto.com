import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { stripe } from '@/lib/stripe'

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    // Check if already exists
    const existing = await stripe.promotionCodes.list({ code: 'LANCIO10', limit: 1 })
    if (existing.data.length > 0) {
      return NextResponse.json({ ok: true, message: 'Already exists', promoCode: 'LANCIO10' })
    }

    const coupon = await stripe.coupons.create({
      name: 'Lanzamiento 10%',
      percent_off: 10,
      duration: 'once',
      redeem_by: Math.floor(new Date('2026-06-09T23:59:59Z').getTime() / 1000),
      metadata: { created_by: 'launch-campaign', campaign: 'lancio-2026' },
    })

    await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'LANCIO10',
      expires_at: Math.floor(new Date('2026-06-09T23:59:59Z').getTime() / 1000),
      metadata: { campaign: 'lancio-2026' },
    })

    return NextResponse.json({ ok: true, couponId: coupon.id, promoCode: 'LANCIO10' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
