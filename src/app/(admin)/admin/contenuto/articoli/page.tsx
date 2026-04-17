import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { ArticlesManager } from './_articles-manager'

export const metadata: Metadata = { title: 'Articoli — Admin' }

export default async function AdminArticoliPage() {
  await requireAdmin()
  return <ArticlesManager />
}
