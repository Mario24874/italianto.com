import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { DownloadsManager } from './_downloads-manager'

export const metadata: Metadata = { title: 'Downloads — Admin' }

export default async function AdminDownloadsPage() {
  await requireAdmin()
  return <DownloadsManager />
}
