'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GiftCardVisual } from './gift-card-visual'
import { useLanguage } from '@/contexts/language-context'
import { Gift } from 'lucide-react'

/** Banner promocional de gift cards para la home y /lancio */
export function GiftCardPromo() {
  const { t } = useLanguage()
  const r = t.pricing.regalo

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/30 to-transparent" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-verde-800/40 bg-gradient-to-br from-verde-950/60 via-bg-dark-2/80 to-bg-dark-2/40 p-8 sm:p-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge variant="brand" className="mb-4">
              <Gift size={11} /> {r.badge}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-verde-50 tracking-tight">
              {r.promoTitle} 🎁
            </h2>
            <p className="text-verde-400 mt-4 max-w-md">{r.promoText}</p>
            <Link href="/regalo" className="inline-block mt-6">
              <Button size="lg" className="px-8">{r.promoCta}</Button>
            </Link>
          </div>
          <div className="flex justify-center md:justify-end">
            <GiftCardVisual planLabel="Avanzato" monthsLabel={r.months3} compact />
          </div>
        </div>
      </div>
    </section>
  )
}
