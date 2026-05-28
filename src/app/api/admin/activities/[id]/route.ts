import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendContentNotification } from '@/lib/email'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = getSupabaseAdmin()
  const body = await req.json()

  // Only notify on status transition → published (not on every save while already published)
  const { data: before } = await supabase.from('activities').select('status').eq('id', id).maybeSingle()
  const wasPublished = before?.status === 'published'

  const { data, error } = await supabase.from('activities').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (!wasPublished && data?.status === 'published') {
    sendContentNotification({
      title: data.title ?? 'Nuova attività',
      type: data.type ?? '',
      level: data.level ?? 'A1',
      contentType: 'attività',
      url: 'https://italianto.com/passatempi',
    }).catch(err => console.error('[activities] Auto-notification failed:', err))
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
