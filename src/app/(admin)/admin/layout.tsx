'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Menu } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-bg-dark text-verde-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 h-full w-64">
            <AdminSidebar isMobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-verde-900/30 bg-bg-dark shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-verde-500 hover:text-verde-300 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-verde-200">Admin Portal</span>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
