'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { useLanguage, LANGUAGES } from '@/contexts/language-context'
import { Menu, Sun, Moon, Globe } from 'lucide-react'
import { FeedbackWidget } from '@/components/dashboard/feedback-widget'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const currentLang = LANGUAGES.find(l => l.code === lang)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="flex h-screen bg-bg-dark text-verde-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <DashboardSidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full w-60">
            <DashboardSidebar isMobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-2 px-4 h-14 border-b border-verde-900/30 bg-bg-dark shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-verde-500 hover:text-verde-300 transition-colors">
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-verde-200 flex-1">Mi Aula</span>
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-verde-500 hover:text-verde-300 hover:bg-verde-950/50 transition-colors"
            >
              <Globe size={13} />
              <span>{currentLang?.flag}</span>
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-1 bg-bg-dark border border-verde-900/50 rounded-xl overflow-hidden shadow-xl z-50 min-w-[130px]">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${lang === l.code ? 'bg-verde-900/40 text-verde-200' : 'text-verde-500 hover:bg-verde-950/50 hover:text-verde-300'}`}
                  >
                    <span>{l.flag}</span><span>{l.label}</span>
                    {lang === l.code && <span className="ml-auto">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Dark mode */}
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg text-verde-500 hover:text-verde-300 hover:bg-verde-950/50 transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <FeedbackWidget />
      </div>
    </div>
  )
}
