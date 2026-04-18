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

  try {
    const { id } = await params
    const { active } = await req.json()
    await stripe.coupons.update(id, {
      metadata: { is_active: active ? 'true' : 'false' },
    })
    // Sync active state to promotion codes
    const promoCodes = await stripe.promotionCodes.list({ coupon: id, limit: 100 })
    await Promise.all(promoCodes.data.map(pc => stripe.promotionCodes.update(pc.id, { active: !!active })))
    return NextResponse.json({ updated: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { id } = await params
    // Delete associated promotion codes first
    const promoCodes = await stripe.promotionCodes.list({ coupon: id, limit: 100 })
    await Promise.all(promoCodes.data.map(pc => stripe.promotionCodes.update(pc.id, { active: false })))
    await stripe.coupons.del(id)
    return NextResponse.json({ deleted: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
