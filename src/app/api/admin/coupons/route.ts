import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { stripe } from '@/lib/stripe'
import type { CouponRow } from '@/types'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function couponToRow(c: Stripe.Coupon): CouponRow {
  return {
    id: c.id,
    code: (c.metadata?.promo_code as string) || (c.metadata?.code as string) || c.id,
    discount_type: c.percent_off != null ? 'percentage' : 'fixed',
    discount_value: c.percent_off ?? (c.amount_off ?? 0) / 100,
    currency: c.currency ?? null,
    applicable_plans: JSON.parse((c.metadata?.applicable_plans as string) || '[]'),
    max_uses: c.max_redemptions ?? null,
    times_used: c.times_redeemed,
    expires_at: c.redeem_by ? new Date(c.redeem_by * 1000).toISOString() : null,
    is_active: c.valid && c.metadata?.is_active !== 'false',
    created_by: (c.metadata?.created_by as string) || 'admin',
    created_at: new Date(c.created * 1000).toISOString(),
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const list = await stripe.coupons.list({ limit: 100 })
    const coupons: CouponRow[] = list.data.map(couponToRow)
    return NextResponse.json({ coupons })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/admin/coupons]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { code, discount_type, discount_value, max_uses, expires_at, applicable_plans, duration } = body

    const normalizedCode = String(code).toUpperCase().trim()

    const params: Stripe.CouponCreateParams = {
      name: normalizedCode,
      duration: duration || 'once',
      ...(discount_type === 'percentage'
        ? { percent_off: Number(discount_value) }
        : { amount_off: Math.round(Number(discount_value) * 100), currency: 'usd' }),
      ...(max_uses ? { max_redemptions: Number(max_uses) } : {}),
      ...(expires_at ? { redeem_by: Math.floor(new Date(expires_at).getTime() / 1000) } : {}),
      metadata: {
        applicable_plans: JSON.stringify(applicable_plans || []),
        created_by: 'admin',
        is_active: 'true',
        promo_code: normalizedCode,
      },
    }

    const coupon = await stripe.coupons.create(params)

    // Create the Promotion Code so users can enter it at checkout
    const promoCodeParams: Stripe.PromotionCodeCreateParams = {
      coupon: coupon.id,
      code: normalizedCode,
      ...(max_uses ? { max_redemptions: Number(max_uses) } : {}),
      ...(expires_at ? { expires_at: Math.floor(new Date(expires_at).getTime() / 1000) } : {}),
      metadata: {
        applicable_plans: JSON.stringify(applicable_plans || []),
        created_by: 'admin',
      },
    }

    try {
      await stripe.promotionCodes.create(promoCodeParams)
    } catch (promoErr) {
      // Promo code creation failed (e.g. code already exists) — coupon still usable via admin apply
      console.warn('[POST /api/admin/coupons] promotion code creation failed:', promoErr instanceof Error ? promoErr.message : promoErr)
    }

    return NextResponse.json({ coupon: couponToRow(coupon) }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/coupons]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
