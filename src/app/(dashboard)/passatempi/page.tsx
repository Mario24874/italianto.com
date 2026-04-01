import type { Metadata } from 'next'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Passatempi — Italianto' }
export default function PassatempiPage() {
  return <UnderConstruction sectionName="Passatempi" />
}
