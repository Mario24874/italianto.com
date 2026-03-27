import type { Metadata } from 'next'
import { Pricing } from '@/components/marketing/pricing'

export const metadata: Metadata = {
  title: 'Precios — Italianto',
  description: 'Elige el plan que mejor se adapte a tu ritmo de aprendizaje. Comienza gratis, sin tarjeta de crédito.',
}

export default function PreciosPage() {
  return (
    <main className="min-h-screen bg-bg-dark pt-20">
      <Pricing />
    </main>
  )
}
