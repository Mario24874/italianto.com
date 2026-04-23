'use client'

import { useState } from 'react'
import { MessageSquare, X, Bug, Star, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'

export function FeedbackWidget() {
  const { t } = useLanguage()
  const fb = t.feedback
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('comment')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const TYPES = [
    { id: 'comment',         label: fb.types.comment,  icon: MessageSquare, color: 'text-verde-400' },
    { id: 'bug_report',      label: fb.types.bug,       icon: Bug,           color: 'text-red-400' },
    { id: 'feature_request', label: fb.types.feature,   icon: Star,          color: 'text-amber-400' },
  ]

  async function submit() {
    if (message.trim().length < 5) {
      toast.error(fb.toastMinLength)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), type }),
      })
      if (!res.ok) throw new Error('Error')
      toast.success(fb.toastSuccess)
      setMessage('')
      setOpen(false)
    } catch {
      toast.error(fb.toastError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-verde-700 hover:bg-verde-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
        aria-label={fb.ariaLabel}
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      {open && (
        <div className="fixed bottom-22 right-6 z-50 w-80 rounded-2xl border border-verde-800/50 bg-bg-dark shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-verde-900/40 flex items-center justify-between">
            <span className="text-sm font-semibold text-verde-200">{fb.title}</span>
            <button onClick={() => setOpen(false)} className="text-verde-600 hover:text-verde-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              {TYPES.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setType(id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    type === id
                      ? 'bg-verde-900/60 border-verde-700/50 text-verde-200'
                      : 'border-verde-900/30 text-verde-500 hover:border-verde-800/40 hover:text-verde-300'
                  }`}
                >
                  <Icon size={16} className={type === id ? color : 'text-verde-600'} />
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={fb.placeholder}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 resize-none transition-colors"
            />

            <button
              onClick={submit}
              disabled={loading || message.trim().length < 5}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {loading ? fb.sending : fb.send}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
