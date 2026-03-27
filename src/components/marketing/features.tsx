'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import {
  Languages,
  BookOpen,
  Mic2,
  MessageSquareText,
  Bot,
  Music2,
  Gamepad2,
  Video,
} from 'lucide-react'
import { SpotlightCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/language-context'

const featureMeta = [
  { key: 'translator' as const, icon: Languages, color: 'text-verde-400', bgColor: 'bg-verde-950/60', borderColor: 'border-verde-800/30', tag: 'ItaliantoApp', large: true, image: '/images/media/img/Genova.jfif' },
  { key: 'conjugator' as const, icon: BookOpen, color: 'text-blue-400', bgColor: 'bg-blue-950/60', borderColor: 'border-blue-800/30', tag: 'ItaliantoApp', large: false },
  { key: 'pronunciation' as const, icon: Mic2, color: 'text-amber-400', bgColor: 'bg-amber-950/60', borderColor: 'border-amber-800/30', tag: 'ItaliantoApp', large: false },
  { key: 'dialogues' as const, icon: MessageSquareText, color: 'text-purple-400', bgColor: 'bg-purple-950/60', borderColor: 'border-purple-800/30', tag: 'Dialogue Studio', large: true, image: '/images/media/img/Arena_di_Verona.jfif' },
  { key: 'tutor' as const, icon: Bot, color: 'text-cyan-400', bgColor: 'bg-cyan-950/60', borderColor: 'border-cyan-800/30', tag: 'ItaliantoApp', large: false },
  { key: 'videos' as const, icon: Video, color: 'text-verde-400', bgColor: 'bg-verde-950/60', borderColor: 'border-verde-800/30', tag: 'platform', large: false },
  { key: 'songs' as const, icon: Music2, color: 'text-pink-400', bgColor: 'bg-pink-950/60', borderColor: 'border-pink-800/30', tag: 'soon', large: false },
  { key: 'games' as const, icon: Gamepad2, color: 'text-orange-400', bgColor: 'bg-orange-950/60', borderColor: 'border-orange-800/30', tag: 'soon', large: false },
]

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useLanguage()

  return (
    <section id="funciones" className="py-24 bg-bg-light-2/50 dark:bg-bg-dark-2/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="brand" className="mb-4">
              {t.features.badge}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-4 tracking-tight">
              {t.features.title1}
              <br />
              <span className="gradient-text">{t.features.title2}</span>
            </h2>
            <p className="text-lg text-verde-400 max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </motion.div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureMeta.map((meta, i) => {
            const { icon: Icon, color, bgColor, borderColor, large, image, tag, key } = meta
            const card = t.features.cards[key]
            const tagLabel = tag === 'soon'
              ? t.features.tags.soon
              : tag === 'platform'
              ? t.features.tags.platform
              : tag

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={large ? 'col-span-1 md:col-span-2 lg:col-span-2' : ''}
              >
                <SpotlightCard
                  className={`h-full p-6 border ${borderColor} overflow-hidden relative group hover:-translate-y-1 transition-transform duration-300`}
                >
                  {large && image && (
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                      <Image
                        src={image}
                        alt={card.title}
                        fill
                        className="object-cover opacity-15 group-hover:opacity-20 group-hover:scale-105 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-light-2 dark:from-bg-dark-2 via-bg-light-2/80 dark:via-bg-dark-2/80 to-transparent" />
                    </div>
                  )}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`size-12 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center`}>
                        <Icon size={22} className={color} />
                      </div>
                      <Badge
                        variant={tag === 'soon' ? 'warning' : tag === 'Dialogue Studio' ? 'info' : 'default'}
                        className="text-[10px]"
                      >
                        {tagLabel}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-verde-50 mb-2">{card.title}</h3>
                    <p className="text-sm text-verde-400 leading-relaxed">{card.description}</p>
                  </div>
                </SpotlightCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
