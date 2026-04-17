import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendStudyReminder } from '@/lib/email'
import { clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

const DAY_NAMES_ES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/**
 * Converts a session's local start time to a UTC Date for today.
 * tz_offset_min = getTimezoneOffset() = (UTC - local) in minutes.
 * UTC_minutes = local_minutes + tz_offset_min
 */
function sessionStartUTC(startHour: number, startMinute: number, tzOffsetMin: number): Date {
  const localMinutes = startHour * 60 + startMinute
  const utcMinutes = ((localMinutes + tzOffsetMin) % 1440 + 1440) % 1440
  const d = new Date()
  d.setUTCHours(Math.floor(utcMinutes / 60), utcMinutes % 60, 0, 0)
  return d
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.replace('Bearer ', '') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdmin() as any
  const now = new Date()
  // day_of_week: 1=Mon..7=Sun. JS getUTCDay(): 0=Sun..6=Sat
  const jsDow = now.getUTCDay()
  const todayDow = jsDow === 0 ? 7 : jsDow
  const todayStr = now.toISOString().slice(0, 10)

  const { data: sessions, error } = await supabase
    .from('study_schedules')
    .select('*')
    .eq('active', true)
    .eq('day_of_week', todayDow)
    .not('reminder_min', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  const client = await clerkClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const session of (sessions ?? []) as any[]) {
    if (session.reminder_last_sent === todayStr) continue

    const sessionStart = sessionStartUTC(
      session.start_hour,
      session.start_minute,
      session.tz_offset_min ?? 0,
    )
    const minutesUntil = (sessionStart.getTime() - now.getTime()) / 60000

    // Fire when within the reminder window (±5 min tolerance)
    if (minutesUntil > 0 && minutesUntil <= session.reminder_min + 5) {
      try {
        const user = await client.users.getUser(session.user_id)
        const email = user.emailAddresses[0]?.emailAddress
        if (!email) continue

        const h = String(session.start_hour).padStart(2, '0')
        const m = String(session.start_minute).padStart(2, '0')

        await sendStudyReminder({
          to: email,
          userName: user.firstName ?? 'Estudiante',
          sessionTitle: session.title,
          sessionType: session.type,
          dayName: DAY_NAMES_ES[todayDow],
          startTime: `${h}:${m}`,
          reminderMinutes: session.reminder_min,
        })

        await supabase
          .from('study_schedules')
          .update({ reminder_last_sent: todayStr })
          .eq('id', session.id)

        sent++
      } catch (err) {
        console.error(`Reminder error for session ${session.id}:`, err)
      }
    }
  }

  return NextResponse.json({ ok: true, reminders_sent: sent })
}
