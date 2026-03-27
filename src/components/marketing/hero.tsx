'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Star, Users, BookOpen, Zap } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

const LANDMARKS = [
  { src: '/images/media/img/Coliseo.jfif', alt: 'Coliseo Romano', city: 'Roma' },
  { src: '/images/media/img/FontanaTrevi.jfif', alt: 'Fontana di Trevi', city: 'Roma' },
  { src: '/images/media/img/Ponte_di_Rialto_Venezia.jfif', alt: 'Ponte di Rialto', city: 'Venezia' },
  { src: '/images/media/img/Torre_de_Pisa_Italia.jfif', alt: 'Torre di Pisa', city: 'Pisa' },
  { src: '/images/media/img/Piazza_San_Pietro_Vaticano.jfif', alt: 'Piazza San Pietro', city: 'Vaticano' },
]

export function Hero() {
  const { t } = useLanguage()
  const STATS = [
    { icon: Users, value: '10K+', label: t.hero.stats.students },
    { icon: BookOpen, value: '3', label: t.hero.stats.apps },
    { icon: Star, value: '4.9', label: t.hero.stats.rating },
    { icon: Zap, value: '100+', label: t.hero.stats.lessons },
  ]
  const [currentImg, setCurrentImg] = useState(0)
  const heroRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, 180])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % LANDMARKS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background Images with Parallax */}
      <motion.div className="absolute inset-0 z-0" style={{ y }}>
        {LANDMARKS.map((landmark, i) => (
          <div
            key={landmark.src}
            className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
            style={{ opacity: i === currentImg ? 1 : 0 }}
          >
            <Image
              src={landmark.src}
              alt={landmark.alt}
              fill
              className="object-cover"
              priority={i === 0}
              quality={85}
            />
          </div>
        ))}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/60 via-bg-dark/50 to-bg-dark" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-dark/80 via-transparent to-bg-dark/60" />
      </motion.div>

      {/* Aurora dots overlay */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(46,125,50,0.4) 0%, transparent 70%)',
            animation: 'aurora 8s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(0,146,70,0.3) 0%, transparent 70%)',
            animation: 'aurora 6s ease-in-out infinite alternate-reverse',
          }}
        />
      </div>

      {/* City label */}
      <motion.div
        className="absolute top-24 right-8 sm:right-16 z-10"
        key={currentImg}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-italia-green animate-pulse" />
          <span className="text-xs text-verde-300 font-medium">
            {LANDMARKS[currentImg].city}
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="max-w-4xl">
          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="brand" dot pulse className="mb-6 text-sm px-4 py-1.5">
              🇮🇹 &nbsp; {t.hero.badge}
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="text-verde-50">{t.hero.line1}</span>
            <br />
            <span className="gradient-text-aurora">{t.hero.line2}</span>
            <br />
            <span className="text-verde-50">{t.hero.line3}</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg sm:text-xl text-verde-300/90 max-w-2xl leading-relaxed mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            {t.hero.subtitle}{' '}
            <em className="text-verde-300 not-italic font-semibold">
              {t.hero.subtitleHighlight}
            </em>
            .
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap gap-4 items-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Button size="xl" asChild className="text-base font-bold">
              <Link href="/sign-up">
                {t.hero.cta}
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild className="text-base">
              <Link href="#apps">
                <Play size={16} className="text-verde-400" />
                {t.hero.ctaSub}
              </Link>
            </Button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            className="flex flex-wrap gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-verde-950/60 border border-verde-800/50 flex items-center justify-center">
                  <Icon size={16} className="text-verde-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-verde-100 leading-none">{value}</div>
                  <div className="text-xs text-verde-500 mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Landmark dots indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {LANDMARKS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentImg(i)}
            className={`transition-all rounded-full ${
              i === currentImg
                ? 'w-6 h-2 bg-verde-400'
                : 'w-2 h-2 bg-verde-700 hover:bg-verde-600'
            }`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 right-8 z-10 flex flex-col items-center gap-1"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-px h-10 bg-gradient-to-b from-verde-400/60 to-transparent" />
        <div className="w-1.5 h-1.5 rounded-full bg-verde-400/60" />
      </motion.div>
    </section>
  )
}
