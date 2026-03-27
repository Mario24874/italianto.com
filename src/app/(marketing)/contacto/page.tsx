'use client'

import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import emailjs from '@emailjs/browser'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { Send, CheckCircle2, AlertCircle, Mail, MapPin } from 'lucide-react'

const EMAILJS_SERVICE_ID  = 'service_d8g3j1y'
const EMAILJS_TEMPLATE_ID = 'template_u0xw46i'
const EMAILJS_PUBLIC_KEY  = 'NscgD18J-QbRDqmhv'

export default function ContactoPage() {
  const { t } = useLanguage()
  const [fields, setFields] = useState({ user_name: '', user_email: '', user_phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFields(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          user_name:  fields.user_name,
          user_email: fields.user_email,
          user_phone: fields.user_phone || '—',
          message:    fields.message,
        },
        EMAILJS_PUBLIC_KEY,
      )
      setStatus('success')
      setFields({ user_name: '', user_email: '', user_phone: '', message: '' })
    } catch (err) {
      console.error('EmailJS error:', err)
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-bg-dark pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="brand" className="mb-4">
            <Mail size={12} />
            {t.contact.badge}
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-4 tracking-tight">
            {t.contact.title}
          </h1>
          <p className="text-lg text-verde-400 max-w-xl mx-auto">
            {t.contact.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Info lateral */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="glass-dark rounded-2xl border border-verde-900/30 p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-verde-950/60 border border-verde-800/30 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-verde-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-verde-300 mb-0.5">Email</div>
                  <a
                    href="mailto:italiantonline@gmail.com"
                    className="text-sm text-verde-500 hover:text-verde-300 transition-colors"
                  >
                    italiantonline@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-verde-950/60 border border-verde-800/30 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-verde-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-verde-300 mb-0.5">Ubicación</div>
                  <div className="text-sm text-verde-500">La Ensenada, Yaracuy, Venezuela</div>
                </div>
              </div>
            </div>
            <div className="flex gap-1 items-center">
              <div className="h-3 w-8 rounded bg-italia-green" />
              <div className="h-3 w-8 rounded bg-white/80" />
              <div className="h-3 w-8 rounded bg-italia-red" />
            </div>
          </motion.div>

          {/* Formulario */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form
              onSubmit={handleSubmit}
              className="glass-dark rounded-2xl border border-verde-900/30 p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-verde-300 mb-1.5">
                    {t.contact.name}
                  </label>
                  <input
                    type="text"
                    name="user_name"
                    value={fields.user_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl bg-verde-950/30 border border-verde-800/40 px-4 py-2.5 text-sm text-verde-100 placeholder-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
                    placeholder="Mario García"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-verde-300 mb-1.5">
                    {t.contact.email}
                  </label>
                  <input
                    type="email"
                    name="user_email"
                    value={fields.user_email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl bg-verde-950/30 border border-verde-800/40 px-4 py-2.5 text-sm text-verde-100 placeholder-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
                    placeholder="mario@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-verde-300 mb-1.5">
                  {t.contact.phone}
                </label>
                <input
                  type="tel"
                  name="user_phone"
                  value={fields.user_phone}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-verde-950/30 border border-verde-800/40 px-4 py-2.5 text-sm text-verde-100 placeholder-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
                  placeholder="+58 412 000 0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-verde-300 mb-1.5">
                  {t.contact.message}
                </label>
                <textarea
                  name="message"
                  value={fields.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full rounded-xl bg-verde-950/30 border border-verde-800/40 px-4 py-2.5 text-sm text-verde-100 placeholder-verde-700 focus:outline-none focus:border-verde-600 transition-colors resize-none"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>

              {status === 'success' && (
                <div className="flex items-center gap-2.5 bg-verde-950/60 border border-verde-700/40 rounded-xl px-4 py-3 text-sm text-verde-300">
                  <CheckCircle2 size={16} className="text-verde-400 shrink-0" />
                  {t.contact.success}
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2.5 bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-300">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  {t.contact.error}
                </div>
              )}

              <Button
                type="submit"
                disabled={status === 'sending' || status === 'success'}
                className="w-full"
              >
                {status === 'sending' ? (
                  t.contact.sending
                ) : (
                  <>
                    <Send size={15} />
                    {t.contact.send}
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
