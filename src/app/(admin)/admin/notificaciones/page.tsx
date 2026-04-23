import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { NotificacionesClient } from './_notificaciones-client'

export const metadata: Metadata = { title: 'Notificaciones — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminNotificacionesPage() {
  await requireAdmin()
  const supabase = getSupabaseAdmin()

  const [{ data: messages }, sysResult] = await Promise.all([
    supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('system_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .catch(() => ({ data: [] })),
  ])

  return (
    <NotificacionesClient
      initialMessages={messages ?? []}
      initialSysNotifs={(sysResult as { data: unknown[] }).data ?? []}
    />
  )
}
