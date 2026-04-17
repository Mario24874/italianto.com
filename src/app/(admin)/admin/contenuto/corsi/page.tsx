import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { CorsiManager } from './_corsi-manager'

export const metadata: Metadata = { title: 'Corsi dal Vivo — Admin' }

export default async function AdminCorsiPage() {
  await requireAdmin()
  return <CorsiManager />
}
