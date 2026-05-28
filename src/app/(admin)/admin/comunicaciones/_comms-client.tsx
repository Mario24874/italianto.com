'use client'

import { useState, useEffect } from 'react'
import { Mail, Users, Send, Eye, EyeOff, AlertCircle, CheckCircle2, Clock, RefreshCw, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLACEHOLDER_HTML = `<h2>Novità su Italianto</h2>
<p>Ciao {{firstName}},</p>
<p>Abbiamo delle novità per te sulla piattaforma...</p>
<p>Continuiamo ad imparare l'italiano insieme!</p>
<p>— Il team di Italianto</p>`

interface Broadcast {
  id: string
  name: string
  status: 'draft' | 'sent' | 'queued'
  created_at: string
  sent_at: string | null
}

export function ComunicacionesClient() {
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [html, setHtml] = useState(PLACEHOLDER_HTML)
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [syncing, setSyncing] = useState(false)

  async function loadData() {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/admin/newsletter')
      const d = await res.json()
      setSubscriberCount(d.subscriberCount ?? 0)
      setBroadcasts(d.broadcasts ?? [])
    } catch {
      setSubscriberCount(0)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function syncUsers() {
    setSyncing(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/sync-users', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, msg: `Sincronización completa: ${data.synced} usuarios agregados a Resend.${data.errors?.length ? ` Errores: ${data.errors.join(', ')}` : ''}` })
        loadData()
      } else {
        setResult({ ok: false, msg: data.error ?? 'Error en sincronización' })
      }
    } catch (e) {
      setResult({ ok: false, msg: String(e) })
    } finally {
      setSyncing(false)
    }
  }

  async function send() {
    if (!subject.trim() || !html.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html, previewText: previewText || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, msg: `Envío iniciado. Broadcast ID: ${data.broadcastId}` })
        setSubject('')
        setPreviewText('')
        setHtml(PLACEHOLDER_HTML)
        loadData()
      } else {
        setResult({ ok: false, msg: data.error ?? 'Error desconocido' })
      }
    } catch (e) {
      setResult({ ok: false, msg: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = (s: string) =>
    s === 'sent' ? 'Enviado' : s === 'queued' ? 'En cola' : 'Borrador'
  const statusColor = (s: string) =>
    s === 'sent' ? 'text-green-400 bg-green-950/40 border-green-800/40'
    : s === 'queued' ? 'text-yellow-400 bg-yellow-950/40 border-yellow-800/40'
    : 'text-verde-500 bg-verde-950/40 border-verde-800/40'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-verde-100 flex items-center gap-2">
            <Mail size={20} className="text-verde-400" />
            Comunicaciones
          </h1>
          <p className="text-sm text-verde-500 mt-0.5">Envía newsletters a todos los usuarios registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={syncUsers}
            disabled={syncing}
            title="Sincronizar todos los usuarios de la plataforma con Resend"
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border',
              'bg-verde-950/40 border-verde-800/40 text-verde-400 hover:text-verde-200 hover:border-verde-600',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <UserPlus size={13} className={syncing ? 'animate-pulse' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar usuarios'}
          </button>
          <div className="flex items-center gap-2 bg-verde-950/40 border border-verde-900/40 rounded-xl px-4 py-2">
            <Users size={14} className="text-verde-500" />
            <span className="text-sm text-verde-300">
              {subscriberCount === null ? '...' : subscriberCount} en Resend
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-verde-950/20 border border-verde-900/30 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-verde-500 uppercase tracking-wider mb-1.5">
            Asunto del email
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="ej. Nuevas actividades de nivel A2 disponibles"
            className="w-full px-4 py-2.5 rounded-xl bg-verde-950/40 border border-verde-800/30 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-verde-500 uppercase tracking-wider mb-1.5">
            Texto de previsualización <span className="text-verde-700 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={previewText}
            onChange={e => setPreviewText(e.target.value)}
            placeholder="Resumen breve que aparece junto al asunto..."
            className="w-full px-4 py-2.5 rounded-xl bg-verde-950/40 border border-verde-800/30 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-verde-500 uppercase tracking-wider">
              Contenido HTML
            </label>
            <button
              onClick={() => setPreview(p => !p)}
              className="flex items-center gap-1.5 text-xs text-verde-500 hover:text-verde-300 transition-colors"
            >
              {preview ? <EyeOff size={12} /> : <Eye size={12} />}
              {preview ? 'Editar' : 'Previsualizar'}
            </button>
          </div>
          {preview ? (
            <div
              className="w-full min-h-[240px] p-5 rounded-xl bg-white text-gray-900 text-sm border border-verde-800/30 overflow-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <textarea
              value={html}
              onChange={e => setHtml(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-xl bg-verde-950/40 border border-verde-800/30 text-verde-200 text-sm font-mono focus:outline-none focus:border-verde-600 transition-colors resize-y"
            />
          )}
          <p className="text-xs text-verde-700 mt-1.5">
            Usa <code className="text-verde-500">{'{{firstName}}'}</code> para el nombre.
            Resend añade el enlace de baja automáticamente.
          </p>
        </div>
      </div>

      {result && (
        <div className={cn(
          'flex items-start gap-3 p-4 rounded-xl border text-sm',
          result.ok
            ? 'bg-green-950/30 border-green-800/40 text-green-300'
            : 'bg-red-950/30 border-red-800/40 text-red-300'
        )}>
          {result.ok ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
          {result.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-verde-600">
          Se enviará a todos los usuarios sincronizados en Resend. Usa "Sincronizar usuarios" para incluir a los ya registrados.
        </p>
        <button
          onClick={send}
          disabled={loading || !subject.trim() || !html.trim()}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
            'bg-verde-700 hover:bg-verde-600 text-white',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Send size={14} />
          {loading ? 'Enviando...' : 'Enviar newsletter'}
        </button>
      </div>

      {/* Historial de envíos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-verde-300 flex items-center gap-2">
            <Clock size={14} className="text-verde-500" />
            Historial de envíos
          </h2>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-xs text-verde-600 hover:text-verde-300 transition-colors"
          >
            <RefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {historyLoading ? (
          <div className="text-center py-8 text-verde-700 text-sm">Cargando historial...</div>
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-8 text-verde-700 text-sm border border-verde-900/30 rounded-xl">
            No hay envíos registrados aún
          </div>
        ) : (
          <div className="space-y-2">
            {broadcasts.map(b => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3 bg-verde-950/20 border border-verde-900/30 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm text-verde-200 font-medium truncate">{b.name || b.id}</p>
                  <p className="text-xs text-verde-600 mt-0.5">
                    {b.sent_at
                      ? `Enviado: ${new Date(b.sent_at).toLocaleString('es-ES')}`
                      : `Creado: ${new Date(b.created_at).toLocaleString('es-ES')}`}
                  </p>
                </div>
                <span className={cn('shrink-0 ml-3 px-2.5 py-1 rounded-full text-xs font-medium border', statusColor(b.status))}>
                  {statusLabel(b.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
