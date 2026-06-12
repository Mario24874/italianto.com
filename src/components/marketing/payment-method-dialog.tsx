'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Smartphone, Landmark, ArrowLeft, CheckCircle2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import type { PlanType, BillingInterval } from '@/lib/plans'

interface ManualInfo {
  pagoMovil: { bank: string; phone: string; documentId: string } | null
  zelle: { email: string; name: string } | null
}

interface Props {
  planId: PlanType
  planName: string
  amountUsd: number
  billingInterval: BillingInterval
  onStripe: () => void
  onClose: () => void
}

type Step = 'method' | 'pago_movil' | 'zelle' | 'done'

export function PaymentMethodDialog({ planId, planName, amountUsd, billingInterval, onStripe, onClose }: Props) {
  const { t } = useLanguage()
  const p = t.pricing.payment
  const [step, setStep] = useState<Step>('method')
  const [info, setInfo] = useState<ManualInfo | null>(null)
  const [reference, setReference] = useState('')
  const [payerName, setPayerName] = useState('')
  const [payerPhone, setPayerPhone] = useState('')
  const [payerBank, setPayerBank] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/payments/manual-info')
      .then(r => r.json())
      .then(setInfo)
      .catch(() => setInfo({ pagoMovil: null, zelle: null }))
  }, [])

  function copy(value: string) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(value)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  async function submit(method: 'pago_movil' | 'zelle') {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: planId,
          billingInterval,
          method,
          reference,
          payerName: payerName || undefined,
          payerPhone: payerPhone || undefined,
          payerBank: payerBank || undefined,
          note: note || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || p.error)
        return
      }
      setStep('done')
    } catch {
      setError(p.error)
    } finally {
      setSubmitting(false)
    }
  }

  function row(label: string, value: string) {
    return (
      <div className="flex items-center justify-between gap-2 py-2 border-b border-verde-900/30 last:border-0">
        <span className="text-xs text-verde-500">{label}</span>
        <button
          type="button"
          onClick={() => copy(value)}
          className="flex items-center gap-1.5 text-sm font-semibold text-verde-100 hover:text-verde-300 transition-colors"
        >
          {value}
          {copied === value
            ? <CheckCircle2 size={13} className="text-verde-500" />
            : <Copy size={13} className="text-verde-600" />}
        </button>
      </div>
    )
  }

  const amountLabel = `$${amountUsd} USD`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl bg-bg-dark border border-verde-900/40 p-7 shadow-2xl max-h-[90vh] overflow-y-auto">

        {step === 'method' && (
          <>
            <h3 className="text-lg font-bold text-verde-50 mb-1">{p.title}</h3>
            <p className="text-sm text-verde-500 mb-5">
              {planName} · {amountLabel}
            </p>
            <div className="space-y-3">
              <button
                onClick={onStripe}
                className="w-full flex items-start gap-3 rounded-xl border border-verde-700/50 bg-verde-950/40 p-4 text-left hover:border-verde-500/70 transition-colors"
              >
                <CreditCard size={20} className="text-verde-400 mt-0.5 shrink-0" />
                <span>
                  <span className="block text-sm font-bold text-verde-100">{p.stripeOption}</span>
                  <span className="block text-xs text-verde-500 mt-0.5">{p.stripeDesc}</span>
                </span>
              </button>
              {info?.pagoMovil && (
                <button
                  onClick={() => setStep('pago_movil')}
                  className="w-full flex items-start gap-3 rounded-xl border border-verde-900/50 bg-bg-dark-2/60 p-4 text-left hover:border-verde-600/60 transition-colors"
                >
                  <Smartphone size={20} className="text-verde-400 mt-0.5 shrink-0" />
                  <span>
                    <span className="block text-sm font-bold text-verde-100">{p.pagoMovilOption}</span>
                    <span className="block text-xs text-verde-500 mt-0.5">{p.pagoMovilDesc}</span>
                  </span>
                </button>
              )}
              {info?.zelle && (
                <button
                  onClick={() => setStep('zelle')}
                  className="w-full flex items-start gap-3 rounded-xl border border-verde-900/50 bg-bg-dark-2/60 p-4 text-left hover:border-verde-600/60 transition-colors"
                >
                  <Landmark size={20} className="text-verde-400 mt-0.5 shrink-0" />
                  <span>
                    <span className="block text-sm font-bold text-verde-100">{p.zelleOption}</span>
                    <span className="block text-xs text-verde-500 mt-0.5">{p.zelleDesc}</span>
                  </span>
                </button>
              )}
            </div>
            <button onClick={onClose} className="mt-5 w-full text-center text-xs text-verde-600 hover:text-verde-400">
              {p.close}
            </button>
          </>
        )}

        {(step === 'pago_movil' || step === 'zelle') && (
          <>
            <button
              onClick={() => { setStep('method'); setError(null) }}
              className="flex items-center gap-1 text-xs text-verde-500 hover:text-verde-300 mb-4"
            >
              <ArrowLeft size={13} /> {p.back}
            </button>
            <h3 className="text-lg font-bold text-verde-50 mb-1">
              {step === 'pago_movil' ? p.pagoMovilOption : p.zelleOption}
            </h3>
            <p className="text-sm text-verde-500 mb-4">
              {p.amountToPay}: <strong className="text-verde-200">{amountLabel}</strong>
              {step === 'pago_movil' && (
                <span className="block text-xs mt-0.5">{p.vesNote}</span>
              )}
            </p>

            <div className="rounded-xl bg-bg-dark-2/70 border border-verde-900/40 px-4 py-2 mb-5">
              <p className="text-xs text-verde-400 pt-2 pb-1 font-semibold">
                {step === 'pago_movil' ? p.instructionsPm : p.instructionsZelle}
              </p>
              {step === 'pago_movil' && info?.pagoMovil && (
                <>
                  {row(p.bank, info.pagoMovil.bank)}
                  {row(p.phone, info.pagoMovil.phone)}
                  {row(p.documentId, info.pagoMovil.documentId)}
                </>
              )}
              {step === 'zelle' && info?.zelle && (
                <>
                  {row(p.emailLabel, info.zelle.email)}
                  {row(p.holder, info.zelle.name)}
                </>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-verde-500 mb-1">{p.reference} *</label>
                <input
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder={p.referencePh}
                  className="w-full rounded-lg bg-bg-dark-2 border border-verde-900/50 px-3 py-2 text-sm text-verde-100 placeholder:text-verde-700 focus:border-verde-600 focus:outline-none"
                />
              </div>
              {step === 'zelle' && (
                <div>
                  <label className="block text-xs text-verde-500 mb-1">{p.senderName} *</label>
                  <input
                    value={payerName}
                    onChange={e => setPayerName(e.target.value)}
                    placeholder={p.senderNamePh}
                    className="w-full rounded-lg bg-bg-dark-2 border border-verde-900/50 px-3 py-2 text-sm text-verde-100 placeholder:text-verde-700 focus:border-verde-600 focus:outline-none"
                  />
                </div>
              )}
              {step === 'pago_movil' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-verde-500 mb-1">{p.payerPhone}</label>
                    <input
                      value={payerPhone}
                      onChange={e => setPayerPhone(e.target.value)}
                      className="w-full rounded-lg bg-bg-dark-2 border border-verde-900/50 px-3 py-2 text-sm text-verde-100 focus:border-verde-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-verde-500 mb-1">{p.payerBank}</label>
                    <input
                      value={payerBank}
                      onChange={e => setPayerBank(e.target.value)}
                      className="w-full rounded-lg bg-bg-dark-2 border border-verde-900/50 px-3 py-2 text-sm text-verde-100 focus:border-verde-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs text-verde-500 mb-1">{p.noteLabel}</label>
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full rounded-lg bg-bg-dark-2 border border-verde-900/50 px-3 py-2 text-sm text-verde-100 focus:border-verde-600 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-400">{error}</p>
            )}

            <Button
              className="w-full mt-5"
              disabled={submitting || reference.trim().length < 4 || (step === 'zelle' && payerName.trim().length < 3)}
              onClick={() => submit(step)}
            >
              {submitting ? p.submitting : p.submit}
            </Button>
          </>
        )}

        {step === 'done' && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-verde-50 mb-2">{p.successTitle}</h3>
            <p className="text-sm text-verde-400 mb-6">{p.successMsg}</p>
            <Button className="w-full" onClick={onClose}>{p.close}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
