import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const SessionSchema = z.object({
  title: z.string().min(1).max(80),
  type: z.enum(['grammatica','vocabolario','ascolto','parlare','lettura','scrittura','tutor','altro']),
  day_of_week: z.number().int().min(1).max(7),
  start_hour: z.number().int().min(0).max(23),
  start_minute: z.number().int().refine(v => v === 0 || v === 30),
  duration_min: z.number().int().refine(v => [30,60,90,120].includes(v)),
  reminder_min: z.number().int().nullable().refine(v => v === null || [15,30,60,120].includes(v)),
  tz_offset_min: z.number().int().min(-840).max(840).default(0),
})

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdmin() as any
  const { data, error } = await supabase
    .from('study_schedules')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('day_of_week').order('start_hour').order('start_minute')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = SessionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdmin() as any

  // Separate tz_offset_min — column may not exist yet if migration hasn't run.
  // Insert core fields first, then attempt to patch tz_offset_min (best-effort).
  const { tz_offset_min, ...coreData } = parsed.data

  const { data, error } = await supabase
    .from('study_schedules')
    .insert({ ...coreData, user_id: userId })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Patch timezone offset — silently ignore if column doesn't exist yet
  await supabase
    .from('study_schedules')
    .update({ tz_offset_min })
    .eq('id', data.id)
    .then(({ error: e }: { error: unknown }) => {
      if (e) console.warn('[schedule] tz_offset_min update skipped:', e)
    })

  return NextResponse.json({ ...data, tz_offset_min }, { status: 201 })
}
