'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'

export default function NotFound() {
  const { t } = useLanguage()
  const nf = t.notFound

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-dark px-6 text-center">
      <p className="text-7xl font-black text-verde-800 mb-4">404</p>
      <h1 className="text-2xl font-bold text-verde-100 mb-2">{nf.title}</h1>
      <p className="text-sm text-verde-600 mb-8 max-w-xs">{nf.subtitle}</p>
      <Link
        href="/"
        className="px-6 py-3 bg-verde-800 hover:bg-verde-700 text-verde-100 text-sm font-semibold rounded-xl transition-colors"
      >
        {nf.cta}
      </Link>
    </div>
  )
}
