import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// PATCH: save ONLY exercises + exercise_translations. Never touches content_html or any lesson field.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  try {
    const { id } = await params
    const body = await req.json()
    const { exercises, exercise_translations } = body

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('lessons')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        ...(exercises !== undefined && { exercises }),
        ...(exercise_translations !== undefined && { exercise_translations }),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .select('id, exercises, exercise_translations')
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, lesson: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PATCH /api/admin/lessons/:id/exercises]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
