import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const { active } = await req.json()
  await stripe.promotionCodes.update(id, { active })
  return NextResponse.json({ updated: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const promo = await stripe.promotionCodes.retrieve(id, { expand: ['coupon'] })
  const couponId = (promo.coupon as { id: string }).id

  try {
    await stripe.coupons.del(couponId)
  } catch {
    // Si el cupón tiene suscripciones activas no se puede eliminar — solo desactivar
    await stripe.promotionCodes.update(id, { active: false })
  }

  return NextResponse.json({ deleted: true })
}
