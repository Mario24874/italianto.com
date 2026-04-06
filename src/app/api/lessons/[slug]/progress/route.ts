import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { slug } = await params
    const { score } = await req.json()

    if (typeof score !== 'number' || score < 0 || score > 10) {
      return NextResponse.json({ error: 'score inválido (0-10)' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: lesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
    }

    const status = score >= 8 ? 'passed' : 'failed'
    const now = new Date().toISOString()

    // Upsert: increment attempts, keep best score
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('id, score, attempts')
      .eq('user_id', userId)
      .eq('lesson_id', lesson.id)
      .maybeSingle()

    if (existing) {
      const bestScore = Math.max(existing.score, score)
      const bestStatus = bestScore >= 8 ? 'passed' : 'failed'
      await supabase
        .from('lesson_progress')
        .update({
          score: bestScore,
          status: bestStatus,
          attempts: existing.attempts + 1,
          completed_at: now,
        })
        .eq('id', existing.id)

      return NextResponse.json({ score: bestScore, status: bestStatus, attempts: existing.attempts + 1 })
    } else {
      const { data } = await supabase
        .from('lesson_progress')
        .insert({
          user_id: userId,
          lesson_id: lesson.id,
          score,
          status,
          attempts: 1,
          completed_at: now,
        })
        .select()
        .single()

      return NextResponse.json({ score: data?.score ?? score, status, attempts: 1 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/lessons/:slug/progress]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
