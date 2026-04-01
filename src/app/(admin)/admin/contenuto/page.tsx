import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Contenido — Admin' }
export default async function AdminContenutoPage() {
  await requireAdmin()
  return <UnderConstruction sectionName="Contenido" />
}
