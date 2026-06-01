'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export function LeadMagnet() {
  const { t } = useLanguage()
  const lm = t.lancio.leadMagnet

  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setErrorMsg('Por favor ingresa un email válido.')
      setState('error')
      return
    }
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/leads/lancio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (data.ok) {
        setState('success')
        setEmail('')
      } else {
        setErrorMsg(data.error ?? 'Error inesperado. Intenta de nuevo.')
        setState('error')
      }
    } catch {
      setErrorMsg('Error de conexión. Intenta de nuevo.')
      setState('error')
    }
  }

  return (
    <section className="py-24 relative overflow-hidden bg-verde-50/80 dark:bg-verde-900/40">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/40 to-transparent" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #2e7d32 0%, transparent 70%)' }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="brand" className="mb-5 text-sm px-4 py-1.5">
            {lm.badge}
          </Badge>

          <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-900 dark:text-verde-50 mb-4 tracking-tight">
            {lm.title}{' '}
            <span className="gradient-text">{lm.titleHighlight}</span>
          </h2>

          <p className="text-lg text-verde-700 dark:text-verde-400 max-w-xl mx-auto mb-10 leading-relaxed">
            {lm.description}{' '}
            <span className="text-verde-700 dark:text-verde-300 font-semibold">{lm.descriptionHighlight}</span>
          </p>

          {state === 'success' ? (
            <div className="flex items-center justify-center gap-3 bg-verde-100/60 dark:bg-verde-950/60 border border-verde-300 dark:border-verde-700/50 rounded-2xl px-8 py-6 text-verde-700 dark:text-verde-300 text-lg font-semibold">
              <span>✅</span>
              <span>{lm.success}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <div className="flex-1 relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-verde-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={lm.placeholder}
                  required
                  className="w-full h-14 pl-11 pr-4 rounded-xl bg-white/80 dark:bg-verde-950/60 border border-verde-300 dark:border-verde-700/50 text-verde-900 dark:text-verde-100 placeholder:text-verde-500 dark:placeholder:text-verde-600 focus:outline-none focus:border-verde-500 focus:ring-1 focus:ring-verde-500 transition-all text-base"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                loading={state === 'loading'}
                className="h-14 px-7 text-base font-bold whitespace-nowrap"
              >
                {lm.cta}
                {state !== 'loading' && <ArrowRight size={16} />}
              </Button>
            </form>
          )}

          {state === 'error' && (
            <p className="mt-3 text-sm text-red-400">{errorMsg}</p>
          )}

          <p className="mt-5 text-xs text-verde-600">
            {lm.privacy}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
