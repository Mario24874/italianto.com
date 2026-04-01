import type { Metadata } from 'next'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Lezioni — Italianto' }
export default function LezioniPage() {
  return <UnderConstruction sectionName="Lezioni" />
}
