import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendContentNotification } from '@/lib/email'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = getSupabaseAdmin()
  const body = await req.json()

  const { data: before } = await supabase.from('downloads').select('status').eq('id', id).maybeSingle()
  const wasPublished = before?.status === 'published'

  const { data, error } = await supabase.from('downloads').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (!wasPublished && data?.status === 'published') {
    sendContentNotification({
      title: data.title ?? 'Nuovo download',
      type: data.type,
      level: data.level,
      contentType: 'download',
      url: 'https://italianto.com/downloads',
    }).catch(err => console.error('[downloads] Auto-notification failed:', err))
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('downloads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
