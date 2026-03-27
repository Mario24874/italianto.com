import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Target, Sparkles, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre Nosotros — Italianto',
  description: 'Conoce la historia detrás de Italianto, la plataforma de aprendizaje de italiano creada con pasión desde Venezuela.',
}

const values = [
  {
    icon: Heart,
    title: 'Pasión por el italiano',
    description: 'Italianto nació del amor genuino por la lengua y cultura italiana. Cada herramienta fue creada para hacer el aprendizaje más cercano, humano y efectivo.',
    color: 'text-red-400',
    bg: 'bg-red-950/30',
    border: 'border-red-800/30',
  },
  {
    icon: Target,
    title: 'Aprendizaje con propósito',
    description: 'No creemos en el contenido masivo sin enfoque. Cada función está diseñada para un objetivo claro: que puedas hablar italiano en el menor tiempo posible.',
    color: 'text-verde-400',
    bg: 'bg-verde-950/30',
    border: 'border-verde-800/30',
  },
  {
    icon: Sparkles,
    title: 'Tecnología al servicio del alumno',
    description: 'Usamos inteligencia artificial no como un gimmick, sino como una herramienta real que adapta la práctica a tu nivel, corrige tu pronunciación y genera contenido personalizado.',
    color: 'text-purple-400',
    bg: 'bg-purple-950/30',
    border: 'border-purple-800/30',
  },
  {
    icon: Globe,
    title: 'Accesible desde cualquier lugar',
    description: 'Desde Venezuela para el mundo. Italianto está disponible en web, Android, iOS y PWA para que puedas aprender desde donde estés, con o sin conexión.',
    color: 'text-blue-400',
    bg: 'bg-blue-950/30',
    border: 'border-blue-800/30',
  },
]

export default function SobreNosotrosPage() {
  return (
    <main className="min-h-screen bg-bg-dark pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center mb-20">
          <Badge variant="brand" className="mb-4">Sobre Nosotros</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-6 tracking-tight">
            Hecho con amor
            <br />
            <span className="gradient-text">por el italiano</span>
          </h1>
          <p className="text-lg text-verde-400 max-w-2xl mx-auto">
            Italianto es una plataforma de aprendizaje de italiano creada en Venezuela con una misión simple:
            hacer que aprender italiano sea accesible, efectivo y, sobre todo, disfrutable.
          </p>
        </div>

        {/* Historia */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-verde-50">Nuestra historia</h2>
            <p className="text-verde-400 leading-relaxed">
              Todo comenzó con una pregunta simple: ¿por qué aprender italiano tiene que ser aburrido?
              Las apps disponibles eran repetitivas, las clases presenciales costosas y el contenido en internet
              estaba disperso sin ningún hilo conductor.
            </p>
            <p className="text-verde-400 leading-relaxed">
              Así nació Italianto — un ecosistema completo donde el alumno tiene en un solo lugar todo lo que necesita:
              un traductor inteligente, un conjugador completo, práctica de pronunciación con retroalimentación real,
              diálogos generados por IA y un tutor conversacional disponible las 24 horas.
            </p>
            <p className="text-verde-400 leading-relaxed">
              Hoy, Italianto está compuesto por tres aplicaciones integradas bajo una sola cuenta:
              la plataforma web, ItaliantoApp (móvil y PWA) y Dialogue Studio.
            </p>
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
          <h2 className="text-3xl font-bold text-verde-50 text-center mb-12">Nuestros valores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map(v => (
              <div key={v.title} className={`rounded-2xl border ${v.border} ${v.bg} p-6`}>
                <div className={`size-11 rounded-xl bg-black/20 border ${v.border} flex items-center justify-center mb-4`}>
                  <v.icon size={20} className={v.color} />
                </div>
                <h3 className="text-lg font-semibold text-verde-50 mb-2">{v.title}</h3>
                <p className="text-sm text-verde-400 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4 items-center justify-center bg-verde-950/40 border border-verde-800/30 rounded-3xl px-10 py-8">
            <div className="text-center sm:text-left">
              <div className="text-xl font-bold text-verde-50 mb-1">¿Listo para empezar?</div>
              <div className="text-sm text-verde-400">Tu primer paso hacia el italiano fluido.</div>
            </div>
            <Button size="xl" className="shrink-0" asChild>
              <Link href="/sign-up">Comenzar gratis →</Link>
            </Button>
          </div>
        </div>

      </div>
    </main>
  )
}
