'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Globe, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export function AppsShowcase() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useLanguage()

  const apps = [
    {
      id: 'italianto-app',
      icon: Smartphone,
      name: 'ItaliantoApp',
      tag: t.apps.app1.tag,
      subtitle: t.apps.app1.subtitle,
      description: t.apps.app1.description,
      features: t.apps.app1.features,
      cta: t.apps.app1.cta,
      ctaHref: process.env.NEXT_PUBLIC_APP_ITALIANTO_URL || 'https://italianto.com/app',
      external: true,
      gradient: 'from-verde-950 via-bg-dark-2 to-bg-dark',
      accentColor: 'text-verde-400',
      borderColor: 'border-verde-800/40',
      badgeVariant: 'brand' as const,
      image: '/images/media/img/Altare_della_Patria.jfif',
    },
    {
      id: 'dialogue-studio',
      icon: Globe,
      name: 'Dialoghi Studio',
      tag: t.apps.app2.tag,
      subtitle: t.apps.app2.subtitle,
      description: t.apps.app2.description,
      features: t.apps.app2.features,
      cta: t.apps.app2.cta,
      ctaHref: process.env.NEXT_PUBLIC_APP_STUDIO_URL || 'https://italianto.com/studio',
      external: true,
      gradient: 'from-purple-950/50 via-bg-dark-2 to-bg-dark',
      accentColor: 'text-purple-400',
      borderColor: 'border-purple-800/40',
      badgeVariant: 'info' as const,
      image: '/images/media/img/Ponte_di_Rialto_Venezia.jfif',
    },
  ]

  return (
    <section id="apps" className="py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="default" className="mb-4">
              {t.apps.badge}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-4 tracking-tight">
              {t.apps.title1}
              <br />
              <span className="gradient-text">{t.apps.title2}</span>
            </h2>
            <p className="text-lg text-verde-400 max-w-2xl mx-auto">
              {t.apps.subtitle}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {apps.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <div
                className={`relative overflow-hidden rounded-3xl border ${app.borderColor} h-full bg-gradient-to-br ${app.gradient} transition-all duration-300 group-hover:shadow-brand-lg`}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={app.image}
                    alt={app.name}
                    fill
                    className="object-cover opacity-10 group-hover:opacity-15 transition-opacity duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-dark/60 to-bg-dark/95" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-8 flex flex-col h-full min-h-[420px]">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <Badge variant={app.badgeVariant} className="mb-3">
                        <app.icon size={12} />
                        {app.tag}
                      </Badge>
                      <h3 className="text-2xl font-bold text-verde-50">{app.name}</h3>
                      <p className={`text-sm mt-1 ${app.accentColor}`}>{app.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-verde-300/80 leading-relaxed mb-6 text-sm sm:text-base">
                    {app.description}
                  </p>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {app.features.map(feat => (
                      <li key={feat} className="flex items-center gap-2.5">
                        <CheckCircle2 size={15} className={app.accentColor} />
                        <span className="text-sm text-verde-300">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="outline"
                    className={`w-full border-current ${app.accentColor} group/btn`}
                    asChild
                  >
                    <a href={app.ctaHref} target="_blank" rel="noopener noreferrer">
                      {app.cta}
                      <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
