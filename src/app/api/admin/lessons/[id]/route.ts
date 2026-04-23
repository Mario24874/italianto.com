import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = getSupabaseAdmin()

    // Fetch current lesson to protect slug of published lessons
    const { data: current } = await supabase
      .from('lessons')
      .select('slug, status')
      .eq('id', id)
      .single()

    const protectedSlug = current?.status === 'published'
      ? current.slug  // slug locked — ignore incoming slug
      : body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')

    const { data, error } = await supabase
      .from('lessons')
      .update({
        ...body,
        slug: protectedSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ lesson: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PUT /api/admin/lessons/:id]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[DELETE /api/admin/lessons/:id]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
