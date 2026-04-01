import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Sesiones — Admin' }
export default async function AdminSesionesPage() {
  await requireAdmin()
  return <UnderConstruction sectionName="Sesiones" />
}
