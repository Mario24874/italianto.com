import type { Metadata } from 'next'
import { Hero } from '@/components/marketing/hero'
import { Features } from '@/components/marketing/features'
import { AppsShowcase } from '@/components/marketing/apps-showcase'
import { Pricing } from '@/components/marketing/pricing'
import { SocialCta } from '@/components/marketing/social-cta'

export const metadata: Metadata = {
  title: 'Italianto — Aprende Italiano con Inteligencia Artificial',
  description:
    'La plataforma integral para aprender italiano. Traductor, conjugador, práctica de pronunciación, diálogos con IA y tutor conversacional. Comienza gratis.',
  alternates: {
    canonical: '/',
  },
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <AppsShowcase />
      <Pricing />
      <SocialCta />
    </>
  )
}
