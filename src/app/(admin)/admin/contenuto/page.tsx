import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import Link from 'next/link'
import { BookOpen, Music, Gamepad2, Info, Video, Download } from 'lucide-react'
import { LessonManager } from './_lesson-manager'

export const metadata: Metadata = { title: 'Contenido — Admin' }

const SECTIONS = [
  { href: '/admin/contenuto', label: 'Lecciones', icon: BookOpen, color: 'text-verde-400' },
  { href: '/admin/contenuto/canzoni', label: 'Canzoni', icon: Music, color: 'text-pink-400' },
  { href: '/admin/contenuto/attivita', label: 'Attività', icon: Gamepad2, color: 'text-amber-400' },
  { href: '/admin/contenuto/articoli', label: 'Articoli', icon: Info, color: 'text-blue-400' },
  { href: '/admin/contenuto/corsi', label: 'Corsi dal Vivo', icon: Video, color: 'text-purple-400' },
  { href: '/admin/contenuto/downloads', label: 'Downloads', icon: Download, color: 'text-cyan-400' },
]

export default async function AdminContenutoPage() {
  await requireAdmin()
  return (
    <div>
      <nav className="flex gap-2 px-6 pt-6 pb-2 flex-wrap">
        {SECTIONS.map(s => (
          <Link key={s.href} href={s.href} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-verde-950/40 border border-verde-900/30 text-xs font-medium text-verde-300 hover:bg-verde-900/40 hover:text-verde-100 transition-colors">
            <s.icon size={13} className={s.color} />
            {s.label}
          </Link>
        ))}
      </nav>
      <LessonManager />
    </div>
  )
}
