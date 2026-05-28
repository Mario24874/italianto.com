import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendContentNotification } from '@/lib/email'

export async function GET() {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('downloads').select('*').order('order_index', { ascending: true })
  if (error) return NextResponse.json({ data: [] })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const body = await req.json()
  const { data, error } = await supabase.from('downloads').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Downloads are public on creation — always notify
  if (data) {
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
