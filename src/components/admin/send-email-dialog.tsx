'use client'

import { useState } from 'react'
import { Mail, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  userEmail: string
  userName: string | null
}

export function SendEmailDialog({ userEmail, userName }: Props) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setOpen(false)
    setSubject('')
    setMessage('')
  }

  async function send() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: userEmail, subject, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      toast.success(`Email enviado a ${userEmail}`)
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar el email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Enviar email"
        className="inline-flex items-center justify-center size-7 rounded-lg text-verde-500 hover:text-verde-300 hover:bg-verde-950/50 transition-colors cursor-pointer"
      >
        <Mail size={13} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-bg-dark border border-verde-900/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-verde-200">Enviar email</h3>
                <p className="text-xs text-verde-600 mt-0.5">
                  {userName ? `${userName} · ` : ''}{userEmail}
                </p>
              </div>
              <button onClick={handleClose} className="text-verde-600 hover:text-verde-400 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto"
              className="w-full px-3 py-2.5 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mensaje"
              rows={5}
              className="w-full px-3 py-2.5 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 transition-colors resize-none"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-xs text-verde-500 hover:text-verde-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={send}
                disabled={loading || !subject.trim() || !message.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-verde-700 hover:bg-verde-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
