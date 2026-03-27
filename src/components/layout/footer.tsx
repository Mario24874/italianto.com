'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/contexts/language-context'
import {
  Youtube,
  Instagram,
  ExternalLink,
  MapPin,
} from 'lucide-react'

const socialLinks = [
  { icon: Youtube, href: 'https://www.youtube.com/@Italiantonline', label: 'YouTube', color: 'hover:text-red-400' },
  { icon: Instagram, href: 'https://www.instagram.com/italiantonline/', label: 'Instagram', color: 'hover:text-pink-400' },
]

export function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  const footerLinks = {
    plataforma: [
      { label: t.nav.features,    href: '/#funciones' },
      { label: t.nav.pricing,     href: '/precios' },
      { label: 'ItaliantoApp',    href: 'https://app.italianto.com', external: true },
      { label: 'Dialogue Studio', href: 'https://studio.italianto.com', external: true },
    ],
    soporte: [
      { label: t.footer.about,   href: '/sobre-nosotros' },
      { label: t.footer.contact, href: '/contacto' },
      { label: t.footer.blog,    href: '/blog' },
    ],
    legal: [
      { label: t.footer.privacy, href: '/privacidad' },
      { label: t.footer.terms,   href: '/terminos' },
      { label: t.footer.cookies, href: '/cookies' },
    ],
  }

  return (
    <footer className="border-t border-verde-200/30 dark:border-verde-900/30 bg-bg-light dark:bg-bg-dark pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top: Brand + Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative size-10 overflow-hidden rounded-xl ring-1 ring-verde-800 group-hover:ring-verde-600 transition-all">
                <Image
                  src="/logo_Italianto.png"
                  alt="Italianto"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-bold text-verde-100">Italianto</span>
            </Link>
            <p className="text-sm text-verde-500 leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
            {/* Italian Flag */}
            <div className="flex gap-1 items-center">
              <div className="h-3 w-6 rounded bg-italia-green" />
              <div className="h-3 w-6 rounded bg-white/80" />
              <div className="h-3 w-6 rounded bg-italia-red" />
              <span className="ml-2 text-xs text-verde-600">{t.footer.love}</span>
            </div>
            {/* Location */}
            <div className="flex items-center gap-1.5 text-xs text-verde-600">
              <MapPin size={12} />
              <span>La Ensenada, Yaracuy, Venezuela</span>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="text-sm font-semibold text-verde-300 mb-4">{t.footer.platform}</h3>
            <ul className="space-y-2.5">
              {footerLinks.plataforma.map(({ label, href, external }) => (
                <li key={href}>
                  <Link
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-1 text-sm text-verde-500 hover:text-verde-300 transition-colors"
                  >
                    {label}
                    {external && <ExternalLink size={11} className="opacity-60" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-verde-300 mb-4">{t.footer.support}</h3>
            <ul className="space-y-2.5">
              {footerLinks.soporte.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-verde-500 hover:text-verde-300 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-verde-300 mb-4">{t.footer.legal}</h3>
            <ul className="space-y-2.5">
              {footerLinks.legal.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-verde-500 hover:text-verde-300 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom: Copyright + Social */}
        <div className="border-t border-verde-200/30 dark:border-verde-900/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-verde-600 text-center sm:text-left">
            © {year} Italianto. {t.footer.rights}
          </p>
          {/* Social Media Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, href, label, color }) => (
              <Link
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`text-verde-600 transition-colors ${color}`}
              >
                <Icon size={18} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
