import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { stripe } from '@/lib/stripe'
import type { CouponRow } from '@/types'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function promoToCouponRow(promo: Stripe.PromotionCode): CouponRow {
  const coupon = promo.coupon as Stripe.Coupon
  return {
    id: promo.id,
    code: promo.code,
    discount_type: coupon.percent_off != null ? 'percentage' : 'fixed',
    discount_value: coupon.percent_off ?? (coupon.amount_off ?? 0) / 100,
    currency: coupon.currency ?? null,
    applicable_plans: JSON.parse((promo.metadata?.applicable_plans as string) || '[]'),
    max_uses: promo.max_redemptions ?? null,
    times_used: promo.times_redeemed,
    expires_at: promo.expires_at ? new Date(promo.expires_at * 1000).toISOString() : null,
    is_active: promo.active,
    created_by: (promo.metadata?.created_by as string) || 'admin',
    created_at: new Date(promo.created * 1000).toISOString(),
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const promoCodes = await stripe.promotionCodes.list({
      limit: 100,
      expand: ['data.coupon'],
    })
    const coupons: CouponRow[] = promoCodes.data.map(promoToCouponRow)
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

    const couponParams: Stripe.CouponCreateParams = {
      duration: duration || 'once',
      ...(discount_type === 'percentage'
        ? { percent_off: Number(discount_value) }
        : { amount_off: Math.round(Number(discount_value) * 100), currency: 'usd' }),
    }

    const coupon = await stripe.coupons.create(couponParams)

    const promoParams: Stripe.PromotionCodeCreateParams = {
      coupon: coupon.id,
      code: String(code).toUpperCase(),
      ...(max_uses ? { max_redemptions: Number(max_uses) } : {}),
      ...(expires_at ? { expires_at: Math.floor(new Date(expires_at).getTime() / 1000) } : {}),
      metadata: {
        applicable_plans: JSON.stringify(applicable_plans || []),
        created_by: 'admin',
      },
    }

    const promoCode = await stripe.promotionCodes.create(promoParams)
    const promoWithCoupon = await stripe.promotionCodes.retrieve(promoCode.id, {
      expand: ['coupon'],
    })

    return NextResponse.json({ coupon: promoToCouponRow(promoWithCoupon) }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/coupons]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
