import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('users')
    .select('preferred_tutor')
    .eq('id', userId)
    .maybeSingle()

  return NextResponse.json({ preferredTutor: (data as { preferred_tutor?: string | null } | null)?.preferred_tutor ?? null })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { slug: string | null }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const supabase = getSupabaseAdmin()
  await supabase
    .from('users')
    .update({ preferred_tutor: body.slug ?? null, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', userId)

  return NextResponse.json({ ok: true })
}
