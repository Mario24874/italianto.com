import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { LessonManager } from './_lesson-manager'

export const metadata: Metadata = { title: 'Contenido — Admin' }

export default async function AdminContenutoPage() {
  await requireAdmin()
  return <LessonManager />
}
