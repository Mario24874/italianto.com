import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('system_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id, resolved_by } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('system_notifications')
    .update({ resolved_at: new Date().toISOString(), resolved_by })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notification: data })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const resolveAll = searchParams.get('resolve_all') === '1'

  const supabase = getSupabaseAdmin()
  if (resolveAll) {
    await supabase
      .from('system_notifications')
      .update({ resolved_at: new Date().toISOString() })
      .is('resolved_at', null)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown operation' }, { status: 400 })
}
