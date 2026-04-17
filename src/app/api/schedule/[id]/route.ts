import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const PatchSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  type: z.enum(['grammatica','vocabolario','ascolto','parlare','lettura','scrittura','tutor','altro']).optional(),
  day_of_week: z.number().int().min(1).max(7).optional(),
  start_hour: z.number().int().min(0).max(23).optional(),
  start_minute: z.number().int().refine(v => v === 0 || v === 30).optional(),
  duration_min: z.number().int().refine(v => [30,60,90,120].includes(v)).optional(),
  reminder_min: z.number().int().nullable().refine(v => v === null || [15,30,60,120].includes(v)).optional(),
  tz_offset_min: z.number().int().min(-840).max(840).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdmin() as any

  // Separate tz_offset_min — may not exist if migration hasn't run yet
  const { tz_offset_min, ...coreData } = parsed.data

  const { data, error } = await supabase
    .from('study_schedules')
    .update({ ...coreData, updated_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', userId)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Patch timezone offset — silently ignore if column doesn't exist yet
  if (tz_offset_min !== undefined) {
    await supabase
      .from('study_schedules')
      .update({ tz_offset_min })
      .eq('id', id)
      .then(({ error: e }: { error: unknown }) => {
        if (e) console.warn('[schedule] tz_offset_min update skipped:', e)
      })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdmin() as any
  const { error } = await supabase
    .from('study_schedules')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
