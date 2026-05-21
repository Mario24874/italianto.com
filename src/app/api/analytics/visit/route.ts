import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let body: { session_id?: string; page?: string; referrer?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.session_id) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('page_visits').insert({
    session_id: body.session_id,
    page: body.page ?? '/',
    referrer: body.referrer ?? null,
    user_agent: req.headers.get('user-agent') ?? null,
  })

  if (error) {
    console.error('[analytics/visit]', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
