import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  let query = supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ data: [] })
  return NextResponse.json({ data: data ?? [] })
}
