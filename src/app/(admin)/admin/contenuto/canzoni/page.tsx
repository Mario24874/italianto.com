import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { SongsManager } from './_songs-manager'

export const metadata: Metadata = { title: 'Canzoni — Admin' }

export default async function AdminCanzoniPage() {
  await requireAdmin()
  return <SongsManager />
}
