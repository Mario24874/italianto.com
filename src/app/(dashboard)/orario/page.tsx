import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { SchedulePage } from '@/components/dashboard/schedule/schedule-page'

export const metadata: Metadata = { title: 'Orario di Studio — Italianto' }

export default async function OrarioPage() {
  const user = await currentUser()
  if (!user) return null

  const supabase = getSupabaseAdmin()
  const { data: sessions } = await supabase
    .from('study_schedules')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('day_of_week').order('start_hour').order('start_minute')

  return <SchedulePage initialSessions={sessions ?? []} userName={user.firstName ?? ''} />
}
