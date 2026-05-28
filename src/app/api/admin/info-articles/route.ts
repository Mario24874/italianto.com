import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendContentNotification } from '@/lib/email'

export async function GET() {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('info_articles').select('*').order('order_index', { ascending: true })
  if (error) return NextResponse.json({ data: [] })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const body = await req.json()
  const { data, error } = await supabase.from('info_articles').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (data?.status === 'published' || !data?.status) {
    sendContentNotification({
      title: data.title ?? 'Nuovo articolo',
      level: data.level,
      contentType: 'articolo',
      url: 'https://italianto.com/informazioni',
    }).catch(err => console.error('[info-articles] Auto-notification failed:', err))
  }

  return NextResponse.json({ data })
}
