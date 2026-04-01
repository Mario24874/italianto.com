import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Analíticas — Admin' }
export default async function AdminAnaliticasPage() {
  await requireAdmin()
  return <UnderConstruction sectionName="Analíticas" />
}
