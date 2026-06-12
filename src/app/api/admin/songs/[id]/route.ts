import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendContentNotification } from '@/lib/email'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = getSupabaseAdmin()
  const body = await req.json()

  const { data: before } = await supabase.from('songs').select('status').eq('id', id).maybeSingle()
  const wasPublished = before?.status === 'published'

  const { data, error } = await supabase.from('songs').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (!wasPublished && data?.status === 'published') {
    sendContentNotification({
      title: data.title ?? 'Nuova canzone',
      type: data.genre,
      level: data.level,
      contentType: 'canzone',
      url: 'https://italianto.com/canzoni',
    }).catch(err => console.error('[songs] Auto-notification failed:', err))
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('songs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
