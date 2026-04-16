'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Menu, X, Sun, Moon, ChevronDown } from 'lucide-react'
import { useLanguage, LANGUAGES, type Language } from '@/contexts/language-context'

export function Header() {
  const pathname = usePathname()
  const { t, lang, setLang } = useLanguage()
  const { setTheme, resolvedTheme } = useTheme()
  const { isSignedIn, isLoaded: clerkLoaded } = useUser()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cerrar dropdown de idioma al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navLinks = [
    { label: t.nav.home,     href: '/' },
    { label: t.nav.features, href: '/#funciones' },
    { label: t.nav.pricing,  href: '/precios' },
    { label: t.nav.about,    href: '/sobre-nosotros' },
    { label: t.nav.contact,  href: '/contacto' },
  ]

  const currentLang = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0]

  if (
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/lezioni') ||
    pathname.startsWith('/canzoni') ||
    pathname.startsWith('/impostazioni') ||
    pathname.startsWith('/admin')
  ) {
    return null
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'glass-dark border-b border-verde-900/30 shadow-brand/10 shadow-lg'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative size-9 overflow-hidden rounded-xl ring-1 ring-verde-700/50 group-hover:ring-verde-500 transition-all">
              <Image src="/logo_Italianto.png" alt="Italianto" fill className="object-cover" priority />
            </div>
            <span className="text-lg font-bold text-verde-100 tracking-tight">Italianto</span>
            <Badge variant="brand" className="hidden sm:flex text-[10px] py-0.5">BETA</Badge>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  pathname === href || (href !== '/' && pathname.startsWith(href))
                    ? 'text-verde-700 dark:text-verde-300 bg-verde-100/80 dark:bg-verde-950/60'
                    : 'text-verde-600/80 dark:text-verde-400/80 hover:text-verde-700 dark:hover:text-verde-300 hover:bg-verde-100/60 dark:hover:bg-verde-950/40'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">

            {/* Language selector */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-verde-400 hover:text-verde-300 hover:bg-verde-950/40 transition-all"
                aria-label="Seleccionar idioma"
              >
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className="hidden sm:inline text-xs font-medium">{currentLang.code.toUpperCase()}</span>
                <ChevronDown size={12} className={cn('transition-transform', isLangOpen && 'rotate-180')} />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 glass-dark rounded-xl border border-verde-800/30 shadow-lg overflow-hidden z-50">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code as Language); setIsLangOpen(false) }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all',
                        lang === l.code
                          ? 'text-verde-700 dark:text-verde-300 bg-verde-100/80 dark:bg-verde-950/60'
                          : 'text-verde-600 dark:text-verde-400 hover:text-verde-700 dark:hover:text-verde-300 hover:bg-verde-100/60 dark:hover:bg-verde-950/40'
                      )}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                      {lang === l.code && <span className="ml-auto text-verde-500 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-verde-400 hover:text-verde-300 hover:bg-verde-950/40 transition-all"
                aria-label="Cambiar tema"
              >
                {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            {/* Auth — visible mientras Clerk carga o usuario no autenticado */}
            {clerkLoaded && isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-verde-400 hover:text-verde-300 transition-colors px-2"
                >
                  {t.auth.myClass}
                </Link>
                <UserButton
                  appearance={{ elements: { avatarBox: 'ring-2 ring-verde-700 hover:ring-verde-500 transition-all' } }}
                  afterSignOutUrl="/"
                />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/sign-in">{t.auth.signIn}</Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/sign-up">{t.auth.signUp}</Link>
                </Button>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-verde-400 hover:text-verde-300 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#060d07]/[0.97] dark:bg-[#060d07]/[0.97] backdrop-blur-md border-t border-verde-200/40 dark:border-verde-900/30 py-4 space-y-1 rounded-b-xl shadow-xl">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  pathname === href
                    ? 'text-verde-700 dark:text-verde-300 bg-verde-100/80 dark:bg-verde-950/60'
                    : 'text-verde-600/80 dark:text-verde-400/80 hover:text-verde-700 dark:hover:text-verde-300 hover:bg-verde-100/60 dark:hover:bg-verde-950/40'
                )}
              >
                {label}
              </Link>
            ))}

            {/* Mobile: idioma */}
            <div className="px-3 py-2 flex items-center gap-2 flex-wrap">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as Language)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                    lang === l.code
                      ? 'bg-verde-200/60 dark:bg-verde-800/40 text-verde-700 dark:text-verde-300 ring-1 ring-verde-400 dark:ring-verde-700'
                      : 'text-verde-600 dark:text-verde-500 hover:text-verde-700 dark:hover:text-verde-300 hover:bg-verde-100/60 dark:hover:bg-verde-950/40'
                  )}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>

            {/* Móvil: botones de auth — visibles siempre que no haya sesión activa */}
            {(!clerkLoaded || !isSignedIn) && (
              <div className="pt-2 flex flex-col gap-2 px-1">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>{t.auth.signIn}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>{t.auth.signUp}</Link>
                </Button>
              </div>
            )}
            {clerkLoaded && isSignedIn && (
              <div className="pt-2 px-1">
                <Button size="sm" asChild className="w-full">
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>{t.auth.myClass}</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
