import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { NotificacionesClient } from './_notificaciones-client'

export const metadata: Metadata = { title: 'Notificaciones — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminNotificacionesPage() {
  await requireAdmin()
  const supabase = getSupabaseAdmin()

  const { data: messages } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return <NotificacionesClient initialMessages={messages ?? []} />
}
