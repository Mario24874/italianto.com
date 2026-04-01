import type { Metadata } from 'next'
import { UnderConstruction } from '@/components/dashboard/under-construction'
export const metadata: Metadata = { title: 'Download — Italianto' }
export default function DownloadsPage() {
  return <UnderConstruction sectionName="Download" />
}
