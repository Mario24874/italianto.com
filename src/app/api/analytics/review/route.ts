import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let body: { rating?: number; comment?: string; reviewer_name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('platform_reviews').insert({
    rating: body.rating,
    comment: body.comment?.trim() || null,
    reviewer_name: body.reviewer_name?.trim() || null,
    status: 'pending',
  })

  if (error) {
    console.error('[analytics/review]', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
