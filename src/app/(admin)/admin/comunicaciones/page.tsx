import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { ComunicacionesClient } from './_comms-client'

export const metadata: Metadata = { title: 'Comunicaciones — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminComunicacionesPage() {
  await requireAdmin()
  return <ComunicacionesClient />
}
