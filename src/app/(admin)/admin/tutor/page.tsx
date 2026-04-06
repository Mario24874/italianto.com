import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { TutorEditor } from './_tutor-editor'

export const metadata: Metadata = { title: 'Tutor AI — Admin' }

export default async function AdminTutorPage() {
  await requireAdmin()
  return <TutorEditor />
}
