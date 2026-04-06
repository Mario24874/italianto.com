import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('tutor_config')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ config: data ?? { id: 'default', knowledge_base: '', system_prompt_template: '' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/admin/tutor]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const { knowledge_base, system_prompt_template } = await req.json()

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('tutor_config')
      .upsert({
        id: 'default',
        knowledge_base: knowledge_base ?? '',
        system_prompt_template: system_prompt_template ?? '',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ config: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PUT /api/admin/tutor]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
