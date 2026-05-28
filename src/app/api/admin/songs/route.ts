import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendContentNotification } from '@/lib/email'

export async function GET() {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('order_index', { ascending: true })
  if (error) return NextResponse.json({ data: [] })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const body = await req.json()
  const { data, error } = await supabase.from('songs').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (data) {
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
