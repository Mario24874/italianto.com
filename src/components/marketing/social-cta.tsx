'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Youtube, Instagram, Play, Users, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/language-context'

export function SocialCta() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useLanguage()

  const socialChannels = [
    {
      name: 'YouTube',
      handle: '@Italiantonline',
      description: t.social.youtube.description,
      icon: Youtube,
      color: 'text-red-400',
      bgColor: 'bg-red-950/30',
      borderColor: 'border-red-800/30',
      followers: '5K+',
      href: 'https://www.youtube.com/@Italiantonline',
      cta: t.social.youtube.cta,
      isYoutube: true,
    },
    {
      name: 'Instagram',
      handle: '@italiantonline',
      description: t.social.instagram.description,
      icon: Instagram,
      color: 'text-pink-400',
      bgColor: 'bg-pink-950/30',
      borderColor: 'border-pink-800/30',
      followers: '3K+',
      href: 'https://www.instagram.com/italiantonline/',
      cta: t.social.instagram.cta,
      isYoutube: false,
    },
  ]

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background with landmark */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/media/img/Piazza_San_Pietro_Vaticano.jfif"
          alt="Piazza San Pietro"
          fill
          className="object-cover opacity-8"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-light dark:from-bg-dark via-bg-light/90 dark:via-bg-dark/90 to-bg-light dark:to-bg-dark" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="brand" className="mb-4">
              <Users size={12} />
              {t.social.badge}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-4 tracking-tight">
              {t.social.title}
              <br />
              <span className="gradient-text">Italianto</span>
            </h2>
            <p className="text-lg text-verde-400 max-w-xl mx-auto">
              {t.social.subtitle}
            </p>
          </motion.div>
        </div>

        {/* Social Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto mb-16">
          {socialChannels.map((channel, i) => (
            <motion.a
              key={channel.name}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -4 }}
            >
              <div
                className={`h-full rounded-2xl border ${channel.borderColor} ${channel.bgColor} p-6 transition-all duration-300 group-hover:shadow-brand/20 group-hover:shadow-xl`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`size-12 rounded-xl bg-black/20 border ${channel.borderColor} flex items-center justify-center`}>
                    <channel.icon size={22} className={channel.color} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-verde-500">
                    <Star size={10} className="fill-verde-600 text-verde-600" />
                    {channel.followers} {t.social.followers}
                  </div>
                </div>
                <div className={`text-lg font-bold ${channel.color} mb-0.5`}>
                  {channel.name}
                </div>
                <div className="text-xs text-verde-500 mb-3">{channel.handle}</div>
                <p className="text-sm text-verde-400 leading-relaxed mb-5">
                  {channel.description}
                </p>
                <div className={`text-sm font-semibold ${channel.color} flex items-center gap-1.5 group-hover:gap-2.5 transition-all`}>
                  {channel.isYoutube ? <Play size={14} /> : null}
                  {channel.cta}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Final CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="inline-flex flex-col sm:flex-row gap-4 items-center justify-center bg-verde-950/40 border border-verde-800/30 rounded-3xl px-10 py-8">
            <div className="text-center sm:text-left">
              <div className="text-xl font-bold text-verde-50 mb-1">
                {t.social.ctaTitle}
              </div>
              <div className="text-sm text-verde-400">
                {t.social.ctaSub}
              </div>
            </div>
            <Button size="xl" className="shrink-0" asChild>
              <Link href="/sign-up">
                {t.social.ctaBtn}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
