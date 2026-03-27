import type { Metadata } from 'next'
import { auth, currentUser } from '@clerk/nextjs/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SpotlightCard } from '@/components/ui/card'
import Link from 'next/link'
import {
  BookOpen, Music, Gamepad2, Info, Video, Download,
  ExternalLink, MessageSquare, Zap,
} from 'lucide-react'

export const metadata: Metadata = { title: "L'Aula — Italianto" }

const sections = [
  { label: 'Lezioni', href: '/lezioni', icon: BookOpen, color: 'text-verde-400', bg: 'bg-verde-950/50 border-verde-800/30', available: true },
  { label: 'Canzoni', href: '/canzoni', icon: Music, color: 'text-pink-400', bg: 'bg-pink-950/30 border-pink-800/30', available: false },
  { label: 'Passatempi', href: '/passatempi', icon: Gamepad2, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-800/30', available: false },
  { label: 'Informazioni', href: '/informazioni', icon: Info, color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-800/30', available: false },
  { label: 'Corsi dal Vivo', href: '/corsi', icon: Video, color: 'text-purple-400', bg: 'bg-purple-950/30 border-purple-800/30', available: false },
  { label: 'Download', href: '/downloads', icon: Download, color: 'text-cyan-400', bg: 'bg-cyan-950/30 border-cyan-800/30', available: false },
]

const externalApps = [
  {
    name: 'ItaliantoApp',
    description: 'Traductor, conjugador y tutor AI',
    href: process.env.NEXT_PUBLIC_APP_ITALIANTO_URL || 'https://app.italianto.com',
    icon: Zap,
    color: 'text-verde-400',
  },
  {
    name: 'Dialogue Studio',
    description: 'Genera diálogos italianos con IA',
    href: process.env.NEXT_PUBLIC_APP_STUDIO_URL || 'https://studio.italianto.com',
    icon: MessageSquare,
    color: 'text-purple-400',
  },
]

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName || 'estudiante'

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-extrabold text-verde-50">
          Benvenuto, {firstName}! 👋
        </h1>
        <p className="text-sm text-verde-500 mt-1">
          Tu espacio de aprendizaje del italiano.
        </p>
      </div>

      {/* Quick access to apps */}
      <div>
        <h2 className="text-sm font-semibold text-verde-400 uppercase tracking-wider mb-3">
          Tus aplicaciones
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {externalApps.map(app => (
            <a
              key={app.name}
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 rounded-2xl border border-verde-900/40 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50 transition-all"
            >
              <div className="size-10 rounded-xl bg-verde-950 border border-verde-800/40 flex items-center justify-center shrink-0">
                <app.icon size={18} className={app.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-verde-200 text-sm">{app.name}</div>
                <div className="text-xs text-verde-500 truncate">{app.description}</div>
              </div>
              <ExternalLink size={14} className="text-verde-600 group-hover:text-verde-400 transition-colors shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* Platform Sections */}
      <div>
        <h2 className="text-sm font-semibold text-verde-400 uppercase tracking-wider mb-3">
          Secciones de la plataforma
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sections.map(({ label, href, icon: Icon, color, bg, available }) => (
            <SpotlightCard key={href} className="relative overflow-hidden">
              <Link
                href={available ? href : '#'}
                className={`block p-5 ${!available ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`size-10 rounded-xl border ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="font-semibold text-sm text-verde-200">{label}</div>
                {!available && (
                  <Badge variant="warning" className="mt-2 text-[10px]">
                    Próximamente
                  </Badge>
                )}
              </Link>
            </SpotlightCard>
          ))}
        </div>
      </div>

      {/* Upgrade CTA for free users */}
      <div className="rounded-2xl border border-verde-700/30 bg-gradient-to-r from-verde-950/60 to-bg-dark-2 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-base font-bold text-verde-100 mb-1">
              Desbloquea todo el potencial
            </div>
            <div className="text-sm text-verde-400">
              Con un plan de pago accedes al Tutor AI, diálogos ilimitados y más.
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/precios">Ver planes →</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
