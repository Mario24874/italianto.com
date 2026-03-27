import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatRelativeTime, getInitials } from '@/lib/utils'
import { Users, Search, Filter, Download, Mail, MoreHorizontal } from 'lucide-react'
import type { UserRow, SubscriptionRow } from '@/types'

export const metadata: Metadata = { title: 'Usuarios — Admin' }
export const dynamic = 'force-dynamic'

type UserWithSub = UserRow & { subscriptions: SubscriptionRow[] }

async function getUsers(): Promise<UserWithSub[]> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('users')
    .select('*, subscriptions(*)')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data || []) as UserWithSub[]
}

export default async function AdminUsuariosPage() {
  await requireAdmin()
  const users = await getUsers()

  const getPlanBadge = (plan: string) => {
    const map: Record<string, 'default' | 'success' | 'info' | 'premium'> = {
      free: 'default',
      essenziale: 'success',
      avanzato: 'info',
      maestro: 'premium',
    }
    return map[plan] || 'default'
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-verde-50 flex items-center gap-2.5">
            <Users size={24} className="text-verde-400" />
            Usuarios
          </h1>
          <p className="text-sm text-verde-500 mt-0.5">
            {users.length} usuarios registrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download size={14} />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-verde-600" />
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-verde-950/40 border border-verde-900/50 text-sm text-verde-200 placeholder:text-verde-600 focus:outline-none focus:border-verde-700 transition-colors"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter size={14} />
          Filtrar
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-verde-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-verde-900/30 bg-verde-950/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide">
                  Usuario
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide hidden sm:table-cell">
                  Plan
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide hidden md:table-cell">
                  Estado
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide hidden lg:table-cell">
                  Registrado
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-verde-900/20">
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-verde-600">
                    No hay usuarios registrados aún.
                  </td>
                </tr>
              )}
              {users.map(user => {
                const activeSub = user.subscriptions?.find(
                  s => s.status === 'active' || s.plan_type !== 'free'
                )
                return (
                  <tr key={user.id} className="hover:bg-verde-950/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-verde-950 border border-verde-800/40 flex items-center justify-center text-xs font-bold text-verde-400 shrink-0">
                          {getInitials(user.full_name || user.email)}
                        </div>
                        <div>
                          <div className="font-medium text-verde-200">
                            {user.full_name || '—'}
                          </div>
                          <div className="text-xs text-verde-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <Badge variant={getPlanBadge(user.plan_type)} className="capitalize">
                        {user.plan_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <Badge
                        variant={activeSub?.status === 'active' ? 'success' : 'default'}
                        dot
                        pulse={activeSub?.status === 'active'}
                      >
                        {activeSub?.status || 'free'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="text-xs text-verde-500">
                        {formatRelativeTime(user.created_at)}
                      </div>
                      <div className="text-[10px] text-verde-700">
                        {formatDate(user.created_at, 'es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="Enviar email">
                          <Mail size={13} />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Más opciones">
                          <MoreHorizontal size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
