import type { Metadata } from 'next'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Corsi dal Vivo — Italianto' }
export default function CorsiPage() {
  return <UnderConstruction sectionName="Corsi dal Vivo" />
}
