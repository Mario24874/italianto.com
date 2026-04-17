import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { ActivitiesManager } from './_activities-manager'

export const metadata: Metadata = { title: 'Attività — Admin' }

export default async function AdminAttivitaPage() {
  await requireAdmin()
  return <ActivitiesManager />
}
