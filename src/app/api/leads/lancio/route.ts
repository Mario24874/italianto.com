import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// SQL to create the table (run in Supabase Dashboard):
// CREATE TABLE IF NOT EXISTS leads (
//   id uuid default gen_random_uuid() primary key,
//   email text unique not null,
//   source text default 'lancio',
//   created_at timestamptz default now()
// );

export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string }
  const { email } = body
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }
  try {
    const supabase = getSupabaseAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('leads')
      .upsert(
        { email: email.toLowerCase().trim(), source: 'lancio' },
        { onConflict: 'email', ignoreDuplicates: true }
      )
    if (error) {
      console.error('[leads/lancio]', error.message)
      // Don't fail — table may not exist yet
    }
    // TODO: Send guide via Resend when RESEND_API_KEY is confirmed
    // await sendGuideEmail(email)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[leads/lancio]', err)
    return NextResponse.json({ ok: true }) // Always return ok to not block UX
  }
}
