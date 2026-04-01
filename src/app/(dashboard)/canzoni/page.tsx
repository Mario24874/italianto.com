import type { Metadata } from 'next'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Canzoni — Italianto' }
export default function CanzoniPage() {
  return <UnderConstruction sectionName="Canzoni" />
}
