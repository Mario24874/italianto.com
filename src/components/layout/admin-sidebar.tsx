'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Tag,
  Settings,
  TrendingUp,
  ChevronRight,
  Activity,
  FileText,
  Globe,
  X,
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
  },
  {
    label: 'Suscripciones',
    href: '/admin/suscripciones',
    icon: CreditCard,
  },
  {
    label: 'Analíticas',
    href: '/admin/analiticas',
    icon: BarChart3,
  },
  {
    label: 'Ventas',
    href: '/admin/ventas',
    icon: TrendingUp,
  },
  {
    label: 'Cupones',
    href: '/admin/cupones',
    icon: Tag,
  },
  {
    label: 'Contenido',
    href: '/admin/contenuto',
    icon: FileText,
  },
  {
    label: 'Sesiones',
    href: '/admin/sesiones',
    icon: Activity,
  },
]

interface AdminSidebarProps {
  onClose?: () => void
  isMobile?: boolean
}

export function AdminSidebar({ onClose, isMobile }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-64 bg-bg-dark border-r border-verde-900/40">
      {/* Logo + Close (mobile) */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-verde-900/30">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="relative size-8 overflow-hidden rounded-lg ring-1 ring-verde-800">
            <Image src="/logo_Italianto.png" alt="Italianto" fill className="object-cover" />
          </div>
          <div>
            <div className="text-sm font-bold text-verde-100 leading-none">Italianto</div>
            <div className="text-[10px] text-verde-500 leading-none mt-0.5">Admin Portal</div>
          </div>
        </Link>
        {isMobile && (
          <button onClick={onClose} className="text-verde-500 hover:text-verde-300 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
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
              {isActive && (
                <ChevronRight size={14} className="ml-auto text-verde-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Platform link + User */}
      <div className="border-t border-verde-900/30 p-4 space-y-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-verde-600 hover:text-verde-400 transition-colors"
        >
          <Globe size={13} />
          Ver plataforma
        </Link>
        <Link
          href="/admin/configuracion"
          className="flex items-center gap-2 text-xs text-verde-600 hover:text-verde-400 transition-colors"
        >
          <Settings size={13} />
          Configuración
        </Link>
        <div className="flex items-center gap-3 pt-2">
          <UserButton
            appearance={{
              elements: { avatarBox: 'size-8 ring-1 ring-verde-800' },
            }}
            afterSignOutUrl="/"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-verde-300 truncate">Administrador</div>
            <div className="text-[10px] text-verde-600">Portal de Admin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
