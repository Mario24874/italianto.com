import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendScheduleCreatedNotification } from '@/lib/email'
import { z } from 'zod'

const SessionSchema = z.object({
  title: z.string().min(1).max(80),
  type: z.enum(['grammatica','vocabolario','ascolto','parlare','lettura','scrittura','tutor','altro']),
  day_of_week: z.number().int().min(1).max(7),
  start_hour: z.number().int().min(0).max(23),
  start_minute: z.number().int().refine(v => v === 0 || v === 30),
  duration_min: z.number().int().refine(v => [30,60,90,120].includes(v)),
  reminder_min: z.number().int().nullable().refine(v => v === null || [15,30,60,120].includes(v)),
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
  const { data, error } = await supabase
    .from('study_schedules')
    .insert({ ...parsed.data, user_id: userId })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send admin notification (fire-and-forget, never fail the request)
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress ?? ''
    const userName = user.firstName ?? 'Usuario'
    const DAY_NAMES_ES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const h = String(parsed.data.start_hour).padStart(2, '0')
    const m = String(parsed.data.start_minute).padStart(2, '0')
    await sendScheduleCreatedNotification({
      userName,
      userEmail: email,
      sessionTitle: parsed.data.title,
      sessionType: parsed.data.type,
      dayName: DAY_NAMES_ES[parsed.data.day_of_week],
      startTime: `${h}:${m}`,
      durationMin: parsed.data.duration_min,
    })
  } catch (err) {
    console.error('Schedule notification error:', err)
  }

  return NextResponse.json(data, { status: 201 })
}
