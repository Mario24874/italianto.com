'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Target, Sparkles, Globe } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import type { LucideIcon } from 'lucide-react'

const valueIcons: LucideIcon[] = [Heart, Target, Sparkles, Globe]
const valueStyles = [
  { color: 'text-red-400',    bg: 'bg-red-950/30',    border: 'border-red-800/30' },
  { color: 'text-verde-400',  bg: 'bg-verde-950/30',  border: 'border-verde-800/30' },
  { color: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-800/30' },
  { color: 'text-blue-400',   bg: 'bg-blue-950/30',   border: 'border-blue-800/30' },
]

export default function SobreNosotrosPage() {
  const { t } = useLanguage()
  const a = t.about

  return (
    <main className="min-h-screen bg-bg-dark pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center mb-20">
          <Badge variant="brand" className="mb-4">{a.badge}</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-6 tracking-tight">
            {a.title1}
            <br />
            <span className="gradient-text">{a.title2}</span>
          </h1>
          <p className="text-lg text-verde-400 max-w-2xl mx-auto">{a.intro}</p>
        </div>

        {/* Historia */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-verde-50">{a.historyTitle}</h2>
            <p className="text-verde-400 leading-relaxed">{a.p1}</p>
            <p className="text-verde-400 leading-relaxed">{a.p2}</p>
            <p className="text-verde-400 leading-relaxed">{a.p3}</p>
          </div>
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-verde-800/30">
              <Image
                src="/images/media/img/Coliseo.jfif"
                alt="Coliseo Romano"
                width={600}
                height={400}
                className="object-cover w-full h-64 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 to-transparent" />
              <div className="absolute bottom-4 left-4 flex gap-1">
                <div className="h-2.5 w-5 rounded bg-italia-green" />
                <div className="h-2.5 w-5 rounded bg-white/80" />
                <div className="h-2.5 w-5 rounded bg-italia-red" />
              </div>
            </div>
          </div>
        </div>

        {/* Valores */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-verde-50 text-center mb-12">{a.valuesTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {a.values.map((v, i) => {
              const Icon = valueIcons[i]
              const s = valueStyles[i]
              return (
                <div key={i} className={`rounded-2xl border ${s.border} ${s.bg} p-6`}>
                  <div className={`size-11 rounded-xl bg-black/20 border ${s.border} flex items-center justify-center mb-4`}>
                    <Icon size={20} className={s.color} />
                  </div>
                  <h3 className="text-lg font-semibold text-verde-50 mb-2">{v.title}</h3>
                  <p className="text-sm text-verde-400 leading-relaxed">{v.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4 items-center justify-center bg-verde-950/40 border border-verde-800/30 rounded-3xl px-10 py-8">
            <div className="text-center sm:text-left">
              <div className="text-xl font-bold text-verde-50 mb-1">{a.ctaTitle}</div>
              <div className="text-sm text-verde-400">{a.ctaSub}</div>
            </div>
            <Button size="xl" className="shrink-0" asChild>
              <Link href="/sign-up">{a.ctaBtn}</Link>
            </Button>
          </div>
        </div>

      </div>
    </main>
  )
}
