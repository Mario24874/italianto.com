import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { LessonRow } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) throw error
    return NextResponse.json({ lessons: data ?? [] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/admin/lessons]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const {
      title, slug, level, order_index, content_html, vocabulary, grammar_notes,
      plan_required, status, intro_video_url, video_subtitles, exercises, ui_language,
    } = body

    if (!title?.trim() || !slug?.trim() || !level) {
      return NextResponse.json({ error: 'title, slug y level son requeridos' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        title: title.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        level,
        order_index: Number(order_index) || 0,
        content_html: content_html || '',
        vocabulary: vocabulary || [],
        grammar_notes: grammar_notes || '',
        plan_required: plan_required || 'free',
        status: status || 'draft',
        intro_video_url: intro_video_url || null,
        video_subtitles: video_subtitles || {},
        exercises: exercises || [],
        ui_language: ui_language || 'es',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ lesson: data as LessonRow }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/lessons]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
