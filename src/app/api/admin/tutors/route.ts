import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('tutors')
    .select('*')
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tutors: data })
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('tutors')
    .insert({
      slug: body.slug,
      name: body.name,
      description: body.description ?? '',
      avatar_url: body.avatar_url || null,
      elevenlabs_voice_id: body.elevenlabs_voice_id || null,
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tutor: data })
}
