'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, Mail, Bug, Star, MessageSquare, ChevronDown, ChevronUp, Trash2, CheckCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface Message {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string | null
  message: string
  type: string
  status: string
  admin_notes: string | null
  created_at: string
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; variant: 'default' | 'info' | 'warning' | 'error' | 'success' }> = {
  contact:         { label: 'Contacto',    icon: Mail,           color: 'text-blue-400',   variant: 'info' },
  comment:         { label: 'Comentario',  icon: MessageSquare,  color: 'text-verde-400',  variant: 'success' },
  bug_report:      { label: 'Reporte',     icon: Bug,            color: 'text-red-400',    variant: 'error' },
  feature_request: { label: 'Sugerencia',  icon: Star,           color: 'text-amber-400',  variant: 'warning' },
}
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'info' | 'success' | 'warning' }> = {
  unread:  { label: 'Sin leer', variant: 'info' },
  read:    { label: 'Leído',    variant: 'default' },
  replied: { label: 'Respondido', variant: 'success' },
  resolved:{ label: 'Resuelto', variant: 'warning' },
}

const FILTERS = ['all', 'unread', 'contact', 'bug_report', 'comment', 'feature_request']
const FILTER_LABELS: Record<string, string> = { all: 'Todos', unread: 'Sin leer', contact: 'Contacto', bug_report: 'Reportes', comment: 'Comentarios', feature_request: 'Sugerencias' }

export function NotificacionesClient({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const filtered = messages.filter(m => {
    if (filter === 'all') return true
    if (filter === 'unread') return m.status === 'unread'
    return m.type === filter
  })

  const unreadCount = messages.filter(m => m.status === 'unread').length

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    } else {
      toast.error('Error al actualizar')
    }
  }

  async function saveNotes(id: string) {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: notes[id] ?? '' }),
    })
    if (res.ok) {
      toast.success('Notas guardadas')
      setMessages(prev => prev.map(m => m.id === id ? { ...m, admin_notes: notes[id] ?? null } : m))
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm('¿Eliminar este mensaje?')) return
    const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMessages(prev => prev.filter(m => m.id !== id))
      toast.success('Mensaje eliminado')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Bell size={24} className="text-verde-400" />
          <div>
            <h1 className="text-2xl font-extrabold text-verde-50">Notificaciones</h1>
            <p className="text-sm text-verde-500">Mensajes de contacto y feedback de alumnos</p>
          </div>
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-900/50 text-blue-300 border border-blue-700/40">
              {unreadCount} sin leer
            </span>
          )}
        </div>
        <p className="text-xs text-verde-600">{messages.length} mensajes total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filter === f
                ? 'bg-verde-900/60 text-verde-200 border-verde-700/50'
                : 'bg-verde-950/20 text-verde-500 border-verde-900/30 hover:text-verde-300 hover:border-verde-800/40'
            }`}
          >
            {FILTER_LABELS[f]}
            {f === 'unread' && unreadCount > 0 && <span className="ml-1.5 bg-blue-800/60 text-blue-300 px-1.5 py-0.5 rounded-full text-[10px]">{unreadCount}</span>}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-verde-600">
            <Bell size={36} className="mx-auto mb-3 text-verde-800" />
            <p>No hay mensajes en esta categoría</p>
          </div>
        )}
        {filtered.map(msg => {
          const typeConf = TYPE_CONFIG[msg.type] ?? TYPE_CONFIG.contact
          const statusConf = STATUS_CONFIG[msg.status] ?? STATUS_CONFIG.unread
          const TypeIcon = typeConf.icon
          const isExpanded = expanded === msg.id
          const isUnread = msg.status === 'unread'

          return (
            <div
              key={msg.id}
              className={`rounded-2xl border transition-all ${isUnread ? 'border-blue-800/40 bg-blue-950/10' : 'border-verde-900/30 bg-verde-950/10'}`}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => {
                  setExpanded(isExpanded ? null : msg.id)
                  if (isUnread) updateStatus(msg.id, 'read')
                }}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-verde-950/40`}>
                  <TypeIcon size={14} className={typeConf.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-verde-200 text-sm">{msg.name || 'Anónimo'}</span>
                    <span className="text-xs text-verde-500">{msg.email}</span>
                    <Badge variant={typeConf.variant} className="text-[10px]">{typeConf.label}</Badge>
                    <Badge variant={statusConf.variant} className="text-[10px]">{statusConf.label}</Badge>
                  </div>
                  <p className="text-xs text-verde-500 truncate mt-0.5">{msg.message}</p>
                </div>
                <span className="text-xs text-verde-600 shrink-0">{formatDate(msg.created_at)}</span>
                {isExpanded ? <ChevronUp size={14} className="text-verde-600 shrink-0" /> : <ChevronDown size={14} className="text-verde-600 shrink-0" />}
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-verde-900/20 pt-3">
                  <p className="text-sm text-verde-300 whitespace-pre-wrap">{msg.message}</p>
                  {msg.phone && <p className="text-xs text-verde-500">Tel: {msg.phone}</p>}

                  {/* Admin notes */}
                  <div>
                    <label className="text-xs text-verde-500 mb-1 block">Notas internas</label>
                    <textarea
                      defaultValue={msg.admin_notes ?? ''}
                      onChange={e => setNotes(prev => ({ ...prev, [msg.id]: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-verde-950/40 border border-verde-800/30 text-verde-200 text-xs focus:outline-none focus:border-verde-600 resize-none"
                      placeholder="Notas para el equipo..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {['read', 'replied', 'resolved'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(msg.id, s)}
                        disabled={msg.status === s}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                          msg.status === s
                            ? 'bg-verde-900/40 text-verde-300 border-verde-700/40'
                            : 'text-verde-500 border-verde-900/30 hover:text-verde-300 hover:border-verde-700/40'
                        }`}
                      >
                        <CheckCheck size={11} className="inline mr-1" />
                        {STATUS_CONFIG[s]?.label}
                      </button>
                    ))}
                    <button
                      onClick={() => saveNotes(msg.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-verde-800/30 text-verde-400 hover:text-verde-200 hover:border-verde-700/40 transition-all"
                    >
                      Guardar notas
                    </button>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-red-900/40 text-red-400 hover:bg-red-950/20 transition-all"
                    >
                      <Trash2 size={11} className="inline mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
