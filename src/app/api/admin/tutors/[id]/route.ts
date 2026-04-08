import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('tutors')
    .update({
      slug: body.slug,
      name: body.name,
      description: body.description ?? '',
      avatar_url: body.avatar_url || null,
      elevenlabs_voice_id: body.elevenlabs_voice_id || null,
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tutor: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('tutors').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
