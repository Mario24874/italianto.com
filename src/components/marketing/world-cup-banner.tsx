'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'

/**
 * Banner estacional full-width — Mundial de fútbol 2026.
 * Enfoque temático/cultural (no afirma resultados de partidos). El texto se
 * muestra en el idioma activo (es/it/en) vía useLanguage → t.worldCup.
 * Imagen de fondo en /public/images/media/img/mundial-2026.jpeg.
 */
export function WorldCupBanner() {
  const { t } = useLanguage()
  const w = t.worldCup

  return (
    <section className="relative overflow-hidden bg-bg-dark">
      {/* Tricolore superior */}
      <div className="flex h-1">
        <div className="flex-1 bg-[#009246]" />
        <div className="flex-1 bg-[#f8fdf8]" />
        <div className="flex-1 bg-[#ce2b37]" />
      </div>

      <div className="relative min-h-[420px] sm:min-h-[470px]">
        {/* Imagen de fondo */}
        <Image
          src="/images/media/img/mundial-2026.jpeg"
          alt={w.badge}
          fill
          quality={80}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Overlays para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/72 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />
        {/* Glow tricolor sutil */}
        <div
          className="pointer-events-none absolute -bottom-24 right-[8%] h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,146,70,0.35) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 mx-auto flex min-h-[420px] sm:min-h-[470px] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ce2b37]/50 bg-[#ce2b37]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a93] backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ce2b37] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ce2b37]" />
              </span>
              🇮🇹 {w.badge}
            </span>

            <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] sm:text-5xl lg:text-6xl">
              {w.title}
            </h2>

            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.75)] sm:text-lg">
              {w.subtitle}
            </p>

            <Button size="xl" asChild className="mt-7 px-8 text-base font-bold shadow-[0_18px_40px_-12px_rgba(0,146,70,0.6)]">
              <Link href="/sign-up">{w.cta} ⚽</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tricolore inferior */}
      <div className="flex h-1">
        <div className="flex-1 bg-[#009246]" />
        <div className="flex-1 bg-[#f8fdf8]" />
        <div className="flex-1 bg-[#ce2b37]" />
      </div>
    </section>
  )
}
