import type { Metadata } from 'next'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Informazioni — Italianto' }
export default function InformazioniPage() {
  return <UnderConstruction sectionName="Informazioni" />
}
