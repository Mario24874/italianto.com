// Called by n8n to report Supabase anomalies / keep-alive pings
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const MONITOR_SECRET = process.env.MONITOR_SECRET || 'italianto-monitor-2026'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-monitor-secret')
  if (auth !== MONITOR_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, severity = 'info', title, message, source = 'n8n', metadata = {} } = body

  if (!type || !title || !message) {
    return NextResponse.json({ error: 'type, title, message required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Avoid duplicate active alerts of same type within last hour
  if (severity !== 'info') {
    const hourAgo = new Date(Date.now() - 3600_000).toISOString()
    const { data: existing } = await supabase
      .from('system_notifications')
      .select('id')
      .eq('type', type)
      .is('resolved_at', null)
      .gte('created_at', hourAgo)
      .limit(1)

    if (existing?.length) {
      return NextResponse.json({ ok: true, duplicate: true })
    }
  }

  const { data, error } = await supabase
    .from('system_notifications')
    .insert({ type, severity, title, message, source, metadata })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

export async function GET(req: NextRequest) {
  // Health check endpoint for n8n to ping
  const auth = req.headers.get('x-monitor-secret')
  if (auth !== MONITOR_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = getSupabaseAdmin()
    const { count, error } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return NextResponse.json({ ok: true, db: 'up', lessons: count })
  } catch (err) {
    return NextResponse.json({ ok: false, db: 'error', error: String(err) }, { status: 503 })
  }
}
