'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SpotlightCard } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import Image from 'next/image'
import {
  BookOpen, Music, Gamepad2, Info, Video, Download,
  ExternalLink, Zap, Crown, Star, Languages, BookMarked,
  Mic, MessageSquare,
} from 'lucide-react'
import type { PlanType } from '@/lib/plans'

interface DashboardContentProps {
  firstName: string
  isPaid: boolean
  planType: PlanType
  planName: string | null
  billingInterval: string | null
  cancelAtPeriodEnd: boolean
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  essenziale: Star,
  avanzato: Zap,
  maestro: Crown,
}

export function DashboardContent({
  firstName,
  isPaid,
  planType,
  planName,
  billingInterval,
  cancelAtPeriodEnd,
}: DashboardContentProps) {
  const { t } = useLanguage()

  const sections = [
    { label: 'Lezioni', href: '/lezioni', icon: BookOpen, color: 'text-verde-400', bg: 'bg-verde-950/50 border-verde-800/30' },
    { label: 'Canzoni', href: '/canzoni', icon: Music, color: 'text-pink-400', bg: 'bg-pink-950/30 border-pink-800/30' },
    { label: 'Passatempi', href: '/passatempi', icon: Gamepad2, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-800/30' },
    { label: 'Informazioni', href: '/informazioni', icon: Info, color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-800/30' },
    { label: 'Corsi dal Vivo', href: '/corsi', icon: Video, color: 'text-purple-400', bg: 'bg-purple-950/30 border-purple-800/30' },
    { label: 'Download', href: '/downloads', icon: Download, color: 'text-cyan-400', bg: 'bg-cyan-950/30 border-cyan-800/30' },
  ]

  const externalApps = [
    {
      name: 'ItaliantoApp',
      description: 'Traductor, conjugador y tutor AI',
      href: process.env.NEXT_PUBLIC_APP_ITALIANTO_URL || '/app',
      logoSrc: '/logo_Italianto.png',
    },
    {
      name: 'Dialoghi Studio',
      description: 'Genera diálogos italianos con IA',
      href: process.env.NEXT_PUBLIC_APP_STUDIO_URL || '/studio',
      logoSrc: '/logo_Italianto.png',
    },
  ]

  const PlanIcon = PLAN_ICONS[planType] ?? Zap

  const appUrl = process.env.NEXT_PUBLIC_APP_ITALIANTO_URL || 'https://italianto.com/app'
  const studioUrl = process.env.NEXT_PUBLIC_APP_STUDIO_URL || 'https://italianto.com/studio'

  const fp = t.dashboard.freePlan
  const freePlanTools = [
    { label: fp.translator.label, description: fp.translator.desc, href: `${appUrl}/traductor`, icon: Languages, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/30' },
    { label: fp.conjugator.label, description: fp.conjugator.desc, href: `${appUrl}/conjugador`, icon: BookMarked, color: 'text-sky-400', bg: 'bg-sky-950/40 border-sky-800/30' },
    { label: fp.pronunciation.label, description: fp.pronunciation.desc, href: `${appUrl}/pronuncia`, icon: Mic, color: 'text-violet-400', bg: 'bg-violet-950/40 border-violet-800/30' },
    { label: fp.dialogues.label, description: fp.dialogues.desc, href: studioUrl, icon: MessageSquare, color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-800/30' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-extrabold text-verde-50">
          {t.dashboard.welcome}{firstName ? `, ${firstName}` : ''}! 👋
        </h1>
        <p className="text-sm text-verde-500 mt-1">{t.dashboard.subtitle}</p>
      </div>

      {/* Free plan tools — only for free users */}
      {!isPaid && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-verde-400 uppercase tracking-wider">
              {t.dashboard.freePlan.sectionTitle}
            </h2>
            <Link href="/precios" className="text-xs text-verde-600 hover:text-verde-400 transition-colors">
              {t.dashboard.freePlan.seePlans}
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {freePlanTools.map(({ label, description, href, icon: Icon, color, bg }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') || href.includes('://') ? '_blank' : undefined}
                rel={href.startsWith('http') || href.includes('://') ? 'noopener noreferrer' : undefined}
                className="group flex flex-col gap-2 p-3.5 rounded-xl border border-verde-900/20 bg-verde-950/10 hover:bg-verde-950/30 hover:border-verde-800/40 transition-all"
              >
                <div className={`size-8 rounded-lg border ${bg} flex items-center justify-center`}>
                  <Icon size={15} className={color} />
                </div>
                <div>
                  <div className="font-semibold text-xs text-verde-200 group-hover:text-verde-100 transition-colors">{label}</div>
                  <div className="text-xs text-verde-600 mt-0.5">{description}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Quick access to apps — paid plans only */}
      {isPaid && (
        <div>
          <h2 className="text-sm font-semibold text-verde-400 uppercase tracking-wider mb-3">
            {t.dashboard.appsTitle}
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
                <div className="size-10 rounded-xl bg-verde-950 border border-verde-800/40 flex items-center justify-center shrink-0 overflow-hidden">
                  <Image src={app.logoSrc} alt={app.name} width={32} height={32} className="object-contain rounded-lg" />
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
      )}

      {/* Platform Sections */}
      <div>
        <h2 className="text-sm font-semibold text-verde-400 uppercase tracking-wider mb-3">
          {t.dashboard.sectionsTitle}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sections.map(({ label, href, icon: Icon, color, bg }) => (
            <SpotlightCard key={href} className="relative overflow-hidden">
              <Link href={href} className="block p-5 cursor-pointer">
                <div className={`size-10 rounded-xl border ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="font-semibold text-sm text-verde-200">{label}</div>
              </Link>
            </SpotlightCard>
          ))}
        </div>
      </div>

      {/* Plan status */}
      {isPaid ? (
        <div className="rounded-2xl border border-verde-700/40 bg-gradient-to-r from-verde-950/60 to-bg-dark-2 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-verde-900/60 border border-verde-700/40 flex items-center justify-center shrink-0">
                <PlanIcon size={18} className="text-verde-400" />
              </div>
              <div>
                <div className="text-base font-bold text-verde-100">
                  Plan {planName ?? planType}
                </div>
                <div className="text-sm text-verde-400">
                  {billingInterval === 'year' ? t.dashboard.billingAnnual : t.dashboard.billingMonthly}
                  {cancelAtPeriodEnd && ` ${t.dashboard.cancelNote}`}
                </div>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/precios">{t.dashboard.changePlanBtn}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-verde-700/30 bg-gradient-to-r from-verde-950/60 to-bg-dark-2 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-base font-bold text-verde-100 mb-1">{t.dashboard.upgradeTitle}</div>
              <div className="text-sm text-verde-400">{t.dashboard.upgradeSub}</div>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/precios">{t.dashboard.upgradeBtn}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
