import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('activities').select('*').order('order_index', { ascending: true })
  if (error) return NextResponse.json({ data: [] })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const body = await req.json()
  const { data, error } = await supabase.from('activities').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
