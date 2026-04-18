import Link from 'next/link'
import { BookOpen, Music, Gamepad2, Info, Video, Download, ChevronLeft } from 'lucide-react'

const SECTIONS = [
  { href: '/admin/contenuto', label: 'Lezioni', icon: BookOpen, color: 'text-verde-400' },
  { href: '/admin/contenuto/canzoni', label: 'Canzoni', icon: Music, color: 'text-pink-400' },
  { href: '/admin/contenuto/attivita', label: 'Attività', icon: Gamepad2, color: 'text-amber-400' },
  { href: '/admin/contenuto/articoli', label: 'Articoli', icon: Info, color: 'text-blue-400' },
  { href: '/admin/contenuto/corsi', label: 'Corsi dal Vivo', icon: Video, color: 'text-purple-400' },
  { href: '/admin/contenuto/downloads', label: 'Downloads', icon: Download, color: 'text-cyan-400' },
]

export default function ContenutoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 px-6 pt-5 pb-1">
        <Link
          href="/admin"
          className="flex items-center gap-1 text-xs text-verde-500 hover:text-verde-300 transition-colors"
        >
          <ChevronLeft size={14} /> Admin
        </Link>
        <span className="text-verde-800 text-xs">/</span>
        <span className="text-xs text-verde-400 font-medium">Contenuto</span>
      </div>
      <nav className="flex gap-2 px-6 pt-3 pb-2 flex-wrap border-b border-verde-900/20">
        {SECTIONS.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-verde-950/40 border border-verde-900/30 text-xs font-medium text-verde-300 hover:bg-verde-900/40 hover:text-verde-100 transition-colors"
          >
            <s.icon size={13} className={s.color} />
            {s.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
