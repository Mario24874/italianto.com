'use client'

import { useState, useEffect } from 'react'
import { Mail, Users, Send, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLACEHOLDER_HTML = `<h2>Novedad en Italianto</h2>
<p>Hola {{firstName}},</p>
<p>Tenemos novedades para ti en la plataforma...</p>
<p>¡Seguimos aprendiendo italiano juntos!</p>
<p>— El equipo de Italianto</p>`

export function ComunicacionesClient() {
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [html, setHtml] = useState(PLACEHOLDER_HTML)
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/newsletter')
      .then(r => r.json())
      .then(d => setSubscriberCount(d.subscriberCount ?? 0))
      .catch(() => setSubscriberCount(0))
  }, [])

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
      } else {
        setResult({ ok: false, msg: data.error ?? 'Error desconocido' })
      }
    } catch (e) {
      setResult({ ok: false, msg: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-verde-100 flex items-center gap-2">
            <Mail size={20} className="text-verde-400" />
            Comunicaciones
          </h1>
          <p className="text-sm text-verde-500 mt-0.5">Envía newsletters a todos los suscriptores</p>
        </div>
        <div className="flex items-center gap-2 bg-verde-950/40 border border-verde-900/40 rounded-xl px-4 py-2">
          <Users size={14} className="text-verde-500" />
          <span className="text-sm text-verde-300">
            {subscriberCount === null ? '...' : subscriberCount} suscriptores activos
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-verde-950/20 border border-verde-900/30 rounded-2xl p-6 space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-verde-500 uppercase tracking-wider mb-1.5">
            Asunto del email
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="ej. Nuevas lecciones de nivel B1 disponibles"
            className="w-full px-4 py-2.5 rounded-xl bg-verde-950/40 border border-verde-800/30 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
          />
        </div>

        {/* Preview text */}
        <div>
          <label className="block text-xs font-semibold text-verde-500 uppercase tracking-wider mb-1.5">
            Texto de previsualización <span className="text-verde-700 font-normal">(opcional — se muestra en bandeja de entrada)</span>
          </label>
          <input
            type="text"
            value={previewText}
            onChange={e => setPreviewText(e.target.value)}
            placeholder="Resumen breve que aparece junto al asunto..."
            className="w-full px-4 py-2.5 rounded-xl bg-verde-950/40 border border-verde-800/30 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
          />
        </div>

        {/* HTML editor / preview toggle */}
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
              className="w-full min-h-[280px] p-5 rounded-xl bg-white text-gray-900 text-sm border border-verde-800/30 overflow-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <textarea
              value={html}
              onChange={e => setHtml(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 rounded-xl bg-verde-950/40 border border-verde-800/30 text-verde-200 text-sm placeholder:text-verde-700 font-mono focus:outline-none focus:border-verde-600 transition-colors resize-y"
            />
          )}
          <p className="text-xs text-verde-700 mt-1.5">
            Puedes usar <code className="text-verde-500">{'{{firstName}}'}</code> para personalizar con el nombre del suscriptor.
            Resend añade automáticamente el enlace de baja (unsubscribe).
          </p>
        </div>
      </div>

      {/* Result banner */}
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

      {/* Send button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-verde-600">
          Se enviará a todos los suscriptores activos en la audiencia de Resend.
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
    </div>
  )
}
