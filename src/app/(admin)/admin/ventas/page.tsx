import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Ventas — Admin' }
export default async function AdminVentasPage() {
  await requireAdmin()
  return <UnderConstruction sectionName="Ventas" />
}
