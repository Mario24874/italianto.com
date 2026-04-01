'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useLanguage, LANGUAGES } from '@/contexts/language-context'
import {
  LayoutDashboard,
  BookOpen,
  Music,
  Gamepad2,
  Info,
  Video,
  Download,
  Settings,
  ChevronRight,
  X,
  Globe,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react'

const navItems = [
  { label: "L'Aula", href: '/dashboard', icon: LayoutDashboard },
  { label: 'Lezioni', href: '/lezioni', icon: BookOpen },
  { label: 'Canzoni', href: '/canzoni', icon: Music },
  { label: 'Passatempi', href: '/passatempi', icon: Gamepad2 },
  { label: 'Info Interessanti', href: '/informazioni', icon: Info },
  { label: 'Corsi dal Vivo', href: '/corsi', icon: Video },
  { label: 'Download', href: '/downloads', icon: Download },
  { label: 'Impostazioni', href: '/impostazioni', icon: Settings },
]

interface DashboardSidebarProps {
  onClose?: () => void
  isMobile?: boolean
}

export function DashboardSidebar({ onClose, isMobile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { lang, setLang, t } = useLanguage()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const currentLang = LANGUAGES.find(l => l.code === lang)

  useEffect(() => { setMounted(true) }, [])

  return (
    <aside className="flex flex-col h-full w-60 bg-bg-dark border-r border-verde-900/40">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-verde-900/30">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative size-8 overflow-hidden rounded-lg ring-1 ring-verde-800 group-hover:ring-verde-600 transition-all">
            <Image src="/logo_Italianto.png" alt="Italianto" fill className="object-cover" />
          </div>
          <span className="text-sm font-bold text-verde-100">Italianto</span>
        </Link>
        {isMobile && (
          <button onClick={onClose} className="text-verde-500 hover:text-verde-300 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-verde-900/50 text-verde-200 border border-verde-800/40'
                  : 'text-verde-500 hover:text-verde-300 hover:bg-verde-950/50'
              )}
            >
              <Icon size={16} className={isActive ? 'text-verde-400' : 'text-verde-600 group-hover:text-verde-400'} />
              {label}
              {isActive && <ChevronRight size={13} className="ml-auto text-verde-500" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-verde-900/30 p-4 space-y-3">
        {/* Language + Theme row */}
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-verde-500 hover:text-verde-300 hover:bg-verde-950/50 transition-colors"
            >
              <Globe size={12} />
              <span>{currentLang?.flag} {currentLang?.label}</span>
              <ChevronDown size={10} className={cn('ml-auto transition-transform', langOpen && 'rotate-180')} />
            </button>
            {langOpen && (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-bg-dark border border-verde-900/50 rounded-xl overflow-hidden shadow-xl z-50">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors',
                      lang === l.code
                        ? 'bg-verde-900/40 text-verde-200'
                        : 'text-verde-500 hover:bg-verde-950/50 hover:text-verde-300'
                    )}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && <span className="ml-auto text-verde-500">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Dark mode toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg text-verde-500 hover:text-verde-300 hover:bg-verde-950/50 transition-colors shrink-0"
              aria-label="Cambiar tema"
            >
              {resolvedTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}
        </div>

        <Link href="/" className="flex items-center gap-2 text-xs text-verde-600 hover:text-verde-400 transition-colors">
          <Globe size={12} />
          {t.dashboard.backHome}
        </Link>
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{ elements: { avatarBox: 'size-8 ring-1 ring-verde-800' } }}
            afterSignOutUrl="/"
          />
          <div className="text-xs text-verde-500">{t.dashboard.myAccount}</div>
        </div>
      </div>
    </aside>
  )
}
