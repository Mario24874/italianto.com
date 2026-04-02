import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Configuración — Admin' }
export default async function AdminConfiguracionPage() {
  await requireAdmin()
  return <UnderConstruction sectionName="Configuración" />
}
