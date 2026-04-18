import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Swaps order_index of two lessons within the same level
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const { id, direction } = await req.json() as { id: string; direction: 'up' | 'down' }
    const supabase = getSupabaseAdmin()

    const { data: lesson } = await supabase
      .from('lessons').select('id, level, order_index').eq('id', id).single()
    const l = lesson as { id: string; level: string; order_index: number } | null
    if (!l) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

    const { data: neighbors } = await supabase
      .from('lessons')
      .select('id, order_index')
      .eq('level', l.level)
      .order('order_index', { ascending: true })

    const rows = (neighbors ?? []) as { id: string; order_index: number }[]
    if (rows.length < 2) return NextResponse.json({ ok: true, message: 'Nothing to swap' })

    const idx = rows.findIndex(r => r.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= rows.length) {
      return NextResponse.json({ ok: true, message: 'Already at boundary' })
    }

    const other = rows[swapIdx]
    await Promise.all([
      supabase.from('lessons').update({ order_index: other.order_index } as never).eq('id', id),
      supabase.from('lessons').update({ order_index: l.order_index } as never).eq('id', other.id),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/lessons/reorder]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
