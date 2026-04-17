import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const resolved = searchParams.get('resolved')

  let query = supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(100)
  if (resolved === 'false') query = query.eq('resolved', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ data: [] })
  return NextResponse.json({ data: data ?? [] })
}
