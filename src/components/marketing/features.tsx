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

const features = [
  {
    icon: Languages,
    title: 'Traductor Inteligente',
    description:
      'Traduce entre español, inglés e italiano con diccionario local de 800+ palabras y DeepL como respaldo. Historial y favoritos incluidos.',
    tag: 'ItaliantoApp',
    color: 'text-verde-400',
    bgColor: 'bg-verde-950/60',
    borderColor: 'border-verde-800/30',
    large: true,
    image: '/images/media/img/Genova.jfif',
  },
  {
    icon: BookOpen,
    title: 'Conjugador Completo',
    description:
      '50+ verbos con 6 tiempos verbales. Pronúncia en audio con ElevenLabs.',
    tag: 'ItaliantoApp',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/60',
    borderColor: 'border-blue-800/30',
    large: false,
  },
  {
    icon: Mic2,
    title: 'Práctica de Pronunciación',
    description:
      'Reconocimiento de voz en tiempo real. Scoring preciso y retroalimentación instantánea.',
    tag: 'ItaliantoApp',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/60',
    borderColor: 'border-amber-800/30',
    large: false,
  },
  {
    icon: MessageSquareText,
    title: 'Diálogos con IA',
    description:
      'Genera diálogos italianos auténticos por contexto o traduce conversaciones. Salida como texto o audio MP3 con voces únicas por personaje.',
    tag: 'Dialogue Studio',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/60',
    borderColor: 'border-purple-800/30',
    large: true,
    image: '/images/media/img/Arena_di_Verona.jfif',
  },
  {
    icon: Bot,
    title: 'Tutor AI Conversacional',
    description:
      'Practica conversaciones reales con un tutor IA que corrige tu gramática en tiempo real.',
    tag: 'ItaliantoApp',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/60',
    borderColor: 'border-cyan-800/30',
    large: false,
  },
  {
    icon: Video,
    title: 'Videos y Lecciones',
    description:
      'Biblioteca de contenido multimedia: vocales, consonantes, meses, estaciones y más.',
    tag: 'Plataforma',
    color: 'text-verde-400',
    bgColor: 'bg-verde-950/60',
    borderColor: 'border-verde-800/30',
    large: false,
  },
  {
    icon: Music2,
    title: 'Canciones en Italiano',
    description:
      'Aprende vocabulario y pronunciación a través de la música italiana.',
    tag: 'Próximamente',
    color: 'text-pink-400',
    bgColor: 'bg-pink-950/60',
    borderColor: 'border-pink-800/30',
    large: false,
  },
  {
    icon: Gamepad2,
    title: 'Juegos Educativos',
    description:
      'Refuerza lo aprendido con minijuegos diseñados para la retención de vocabulario.',
    tag: 'Próximamente',
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/60',
    borderColor: 'border-orange-800/30',
    large: false,
  },
]

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0]
  index: number
}) {
  const { icon: Icon, title, description, tag, color, bgColor, borderColor, large, image } = feature
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={large ? 'col-span-1 md:col-span-2 lg:col-span-2' : ''}
    >
      <SpotlightCard
        className={`h-full p-6 border ${borderColor} overflow-hidden relative group hover:-translate-y-1 transition-transform duration-300`}
      >
        {large && image && (
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover opacity-15 group-hover:opacity-20 group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark-2 via-bg-dark-2/80 to-transparent" />
          </div>
        )}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`size-12 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center`}>
              <Icon size={22} className={color} />
            </div>
            <Badge
              variant={tag === 'Próximamente' ? 'warning' : tag === 'Dialogue Studio' ? 'info' : 'default'}
              className="text-[10px]"
            >
              {tag}
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-verde-50 mb-2">{title}</h3>
          <p className="text-sm text-verde-400 leading-relaxed">{description}</p>
        </div>
      </SpotlightCard>
    </motion.div>
  )
}

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="funciones" className="py-24 bg-bg-dark-2/50 relative overflow-hidden">
      {/* Background accent */}
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
              Funcionalidades
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-4 tracking-tight">
              Todo lo que necesitas
              <br />
              <span className="gradient-text">para el italiano</span>
            </h2>
            <p className="text-lg text-verde-400 max-w-2xl mx-auto">
              Un ecosistema completo de herramientas educativas impulsadas por IA
              para que aprendas a tu ritmo, en tu idioma y desde cualquier dispositivo.
            </p>
          </motion.div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
