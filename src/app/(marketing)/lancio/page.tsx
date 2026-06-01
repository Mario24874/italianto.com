'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pricing } from '@/components/marketing/pricing'
import { CountdownTimer } from './_countdown'
import { MockDemo } from './_mock-demo'
import { LeadMagnet } from './_lead-magnet'
import { FAQ } from './_faq'
import { HeroClient } from './_hero-client'
import { PromoCodeCopy } from './_promo-copy'
import { useLanguage } from '@/contexts/language-context'

const FEATURE_ICONS = ['🤖', '📚', '🎵', '🎮', '📰', '💬', '📱', '🏆']
const FEATURE_VARIANTS = [
  'info', 'success', 'warning', 'warning', 'info', 'default', 'default', 'premium',
] as const

export default function LancioPage() {
  const { t } = useLanguage()
  const lc = t.lancio

  return (
    <>
      {/* A. HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/media/img/Coliseo.jfif"
            alt="Coliseo Romano"
            fill
            className="object-cover"
            priority
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-transparent to-black/70" />
        </div>

        {/* Aurora effect */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(46,125,50,0.4) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="max-w-4xl">
            <Badge variant="brand" dot pulse className="mb-6 text-sm px-4 py-1.5">
              {lc.hero.badge}
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              <span className="text-verde-50">{lc.hero.title1}</span>
              <br />
              <span className="gradient-text">{lc.hero.title2}</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed mb-8">
              {lc.hero.subtitle}{' '}
              <em className="not-italic font-semibold text-verde-300">{lc.hero.subtitleHighlight}</em>
            </p>

            {/* Countdown */}
            <div className="mb-8">
              <p className="text-xs text-verde-300 uppercase tracking-widest font-semibold mb-3">
                {lc.hero.offerLabel}
              </p>
              <CountdownTimer />
            </div>

            {/* Promo code highlight */}
            <div className="inline-flex flex-wrap items-center gap-3 bg-verde-950/70 border border-verde-700/60 rounded-2xl px-5 py-3 mb-10">
              <span className="text-sm text-white/80">
                {lc.hero.promoLabel}
              </span>
              <PromoCodeCopy code="LANCIO10" />
              <span className="text-sm text-verde-200">
                {lc.hero.promoDetail}
              </span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 items-center mb-14">
              <Button size="xl" asChild className="text-base font-bold">
                <Link href="/sign-up">
                  {lc.hero.ctaPrimary}
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="text-base">
                <Link href="#precios">
                  {lc.hero.ctaSecondary}
                </Link>
              </Button>
            </div>

            {/* Stats row */}
            <HeroClient />
          </div>
        </div>
      </section>

      {/* B. PLATFORM DEMO MOCK */}
      <MockDemo />

      {/* C. FEATURES GRID */}
      <section className="py-24 bg-bg-dark/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="brand" className="mb-4">
              {lc.features.badge}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-900 dark:text-verde-50 mb-4 tracking-tight">
              {lc.features.title}{' '}
              <span className="gradient-text">{lc.features.highlight}</span>
            </h2>
            <p className="text-lg text-verde-700 dark:text-verde-400 max-w-2xl mx-auto">
              {lc.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lc.features.items.map((feature, i) => (
              <div
                key={feature.title}
                className="bg-verde-50 dark:bg-verde-950/40 border border-verde-200 dark:border-verde-800/30 rounded-2xl p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-300"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{FEATURE_ICONS[i]}</span>
                  <Badge variant={FEATURE_VARIANTS[i]} className="text-[10px]">
                    {feature.tag}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-verde-800 dark:text-verde-100">{feature.title}</h3>
                <p className="text-xs text-verde-700 dark:text-verde-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* D. APPS SHOWCASE */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="brand" className="mb-4">{lc.apps.badge}</Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-900 dark:text-verde-50 mb-4 tracking-tight">
              {lc.apps.title}{' '}
              <span className="gradient-text">{lc.apps.highlight}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dialoghi Studio */}
            <div className="bg-verde-50 dark:bg-verde-950/40 border border-purple-800/30 rounded-2xl p-8 flex flex-col gap-6">
              <div>
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-2xl font-extrabold text-verde-900 dark:text-verde-50 mb-3">Dialoghi Studio</h3>
                <p className="text-verde-700 dark:text-verde-400 leading-relaxed">
                  {lc.apps.dialoghi.description}
                </p>
              </div>
              <ul className="space-y-2">
                {lc.apps.dialoghi.features.map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-verde-700 dark:text-verde-300">
                    <span className="text-verde-700 dark:text-verde-400">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Badge variant="info" className="self-start">
                {lc.apps.dialoghi.badge}
              </Badge>
            </div>

            {/* ItaliantoApp */}
            <div className="bg-verde-50 dark:bg-verde-950/40 border border-verde-200 dark:border-verde-800/30 rounded-2xl p-8 flex flex-col gap-6">
              <div>
                <div className="text-4xl mb-3">📱</div>
                <h3 className="text-2xl font-extrabold text-verde-900 dark:text-verde-50 mb-3">ItaliantoApp</h3>
                <p className="text-verde-700 dark:text-verde-400 leading-relaxed">
                  {lc.apps.italiantoapp.description}
                </p>
              </div>
              <ul className="space-y-2">
                {lc.apps.italiantoapp.features.map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-verde-700 dark:text-verde-300">
                    <span className="text-verde-700 dark:text-verde-400">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Badge variant="success" className="self-start">
                {lc.apps.italiantoapp.badge}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* E. SOCIAL PROOF / TESTIMONIALS */}
      <section className="py-24 bg-bg-dark/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="brand" className="mb-4">{lc.testimonials.badge}</Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-900 dark:text-verde-50 tracking-tight">
              {lc.testimonials.title}{' '}
              <span className="gradient-text">{lc.testimonials.highlight}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {lc.testimonials.items.map(item => (
              <div
                key={item.name}
                className="bg-verde-50 dark:bg-verde-950/40 border border-verde-200 dark:border-verde-800/30 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">⭐</span>
                  ))}
                </div>
                <p className="text-sm text-verde-700 dark:text-verde-300 leading-relaxed flex-1 italic">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="text-xs text-verde-600 dark:text-verde-500 font-semibold">
                  — {item.name}, {item.country}
                </div>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lc.testimonials.stats.map(stat => (
              <div
                key={stat.label}
                className="bg-verde-50 dark:bg-verde-950/40 border border-verde-200 dark:border-verde-800/30 rounded-2xl p-5 text-center"
              >
                <div className="text-3xl font-extrabold text-verde-800 dark:text-verde-100 mb-1">{stat.value}</div>
                <div className="text-xs text-verde-600 dark:text-verde-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* F. PRICING SECTION */}
      <section className="relative" id="precios">
        {/* Launch banner */}
        <div className="bg-gradient-to-r from-verde-900/80 via-verde-800/60 to-verde-900/80 border-y border-verde-700/40 py-4">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <p className="text-sm sm:text-base font-semibold text-verde-900 dark:text-verde-100">
              <span className="font-extrabold text-verde-900 dark:text-verde-50">{lc.pricing.offerBanner}</span>
              {' '}· {lc.pricing.offerDetail.split('·')[0].trim()} ·{' '}
              Usa{' '}
              <span className="font-mono bg-verde-800/60 border border-verde-600/50 rounded px-2 py-0.5 text-verde-900 dark:text-verde-200">LANCIO10</span>
              {' '}· <span className="text-verde-700 dark:text-verde-300 font-bold">{lc.pricing.offerDetail.split('·').slice(-1)[0].trim()}</span>
            </p>
          </div>
        </div>
        <Pricing />
      </section>

      {/* G. LEAD MAGNET */}
      <LeadMagnet />

      {/* H. FAQ */}
      <FAQ />

      {/* I. FINAL CTA */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-verde-950/20 to-bg-dark">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/40 to-transparent" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full opacity-8"
            style={{ background: 'radial-gradient(ellipse, #2e7d32 0%, transparent 70%)' }}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-900 dark:text-verde-50 mb-4 tracking-tight">
            {lc.cta.title}{' '}
            <span className="gradient-text">{lc.cta.highlight}</span>
          </h2>
          <p className="text-lg text-verde-700 dark:text-verde-400 mb-8">
            {lc.cta.subtitle}
          </p>

          {/* Countdown reminder */}
          <div className="inline-flex flex-col items-center gap-4 mb-10">
            <div className="flex items-center gap-2 text-sm text-verde-700 dark:text-verde-400">
              <span>⏳</span>
              <span>{lc.cta.offerReminder}</span>
            </div>
            <CountdownTimer />
            <div className="flex items-center gap-2 text-sm text-verde-700 dark:text-verde-400 mt-1">
              <span>{lc.cta.codeLine}</span>
              <span className="font-mono bg-verde-100/70 dark:bg-verde-950/60 border border-verde-300 dark:border-verde-700/50 rounded px-3 py-1 text-verde-700 dark:text-verde-200 font-bold tracking-widest">
                LANCIO10
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="xl" asChild className="text-base font-bold">
              <Link href="/sign-up">
                {lc.cta.primary}
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="text-base">
              <Link href="#precios">
                {lc.cta.secondary}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
