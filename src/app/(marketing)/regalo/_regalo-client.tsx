'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GiftCardVisual } from '@/components/marketing/gift-card-visual'
import { useLanguage } from '@/contexts/language-context'
import { PLANS, type PlanType } from '@/lib/plans'
import { Gift, Ticket, CheckCircle2, XCircle } from 'lucide-react'

const GIFT_PLANS = PLANS.filter(plan => plan.id !== 'free')
const MONTH_OPTIONS = [1, 3, 12] as const

function priceFor(planId: PlanType, months: number): number {
  const plan = PLANS.find(pl => pl.id === planId)
  if (!plan) return 0
  return months === 12 ? plan.annualPrice : plan.monthlyPrice * months
}

export function RegaloClient({ initialStatus }: { initialStatus: 'success' | 'canceled' | null }) {
  const { t, lang } = useLanguage()
  const r = t.pricing.regalo
  const { isSignedIn } = useUser()

  const [planId, setPlanId] = useState<PlanType>('avanzato')
  const [months, setMonths] = useState<(typeof MONTH_OPTIONS)[number]>(3)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [buying, setBuying] = useState(false)
  const [buyError, setBuyError] = useState<string | null>(null)
  const [banner, setBanner] = useState(initialStatus)

  const [redeemCode, setRedeemCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemResult, setRedeemResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const monthsLabel = (m: number) => (m === 1 ? r.months1 : m === 3 ? r.months3 : r.months12)
  const total = priceFor(planId, months)
  const selectedPlan = GIFT_PLANS.find(plan => plan.id === planId)

  async function buy() {
    setBuying(true)
    setBuyError(null)
    try {
      const res = await fetch('/api/gift-cards/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: planId,
          months,
          buyerEmail,
          buyerName: buyerName || undefined,
          recipientEmail: recipientEmail || undefined,
          recipientName: recipientName || undefined,
          message: message || undefined,
          lang,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setBuyError(data.error || r.error)
        setBuying(false)
        return
      }
      window.location.href = data.url
    } catch {
      setBuyError(r.error)
      setBuying(false)
    }
  }

  async function redeem() {
    setRedeeming(true)
    setRedeemResult(null)
    try {
      const res = await fetch('/api/gift-cards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode }),
      })
      const data = await res.json()
      if (res.ok) {
        setRedeemResult({ ok: true, msg: r.redeemSuccess })
      } else {
        const msg =
          data.error === 'not_found' || data.error === 'invalid_code' ? r.redeemNotFound
          : data.error === 'already_redeemed' ? r.redeemUsed
          : data.error === 'expired' ? r.redeemExpired
          : r.redeemError
        setRedeemResult({ ok: false, msg })
      }
    } catch {
      setRedeemResult({ ok: false, msg: r.redeemError })
    } finally {
      setRedeeming(false)
    }
  }

  const inputCls =
    'w-full rounded-lg bg-bg-dark-2 border border-verde-900/50 px-3 py-2.5 text-sm text-verde-100 placeholder:text-verde-700 focus:border-verde-600 focus:outline-none'

  return (
    <main className="min-h-screen bg-bg-dark pt-24 pb-24 relative overflow-hidden">
      {/* atmósfera */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #009246 0%, transparent 70%)' }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">

        {banner && (
          <div
            className={`mb-10 flex items-start gap-3 rounded-2xl border p-5 ${
              banner === 'success'
                ? 'border-verde-700/50 bg-verde-950/50'
                : 'border-amber-800/50 bg-amber-950/30'
            }`}
          >
            {banner === 'success'
              ? <CheckCircle2 size={20} className="text-verde-400 mt-0.5 shrink-0" />
              : <XCircle size={20} className="text-amber-400 mt-0.5 shrink-0" />}
            <div className="flex-1">
              {banner === 'success' ? (
                <>
                  <p className="font-bold text-verde-100">{r.successTitle}</p>
                  <p className="text-sm text-verde-400 mt-1">{r.successMsg}</p>
                </>
              ) : (
                <p className="text-sm text-amber-200">{r.canceledMsg}</p>
              )}
            </div>
            <button onClick={() => setBanner(null)} className="text-verde-600 hover:text-verde-400 text-xs">✕</button>
          </div>
        )}

        {/* Hero: texto + tarjeta viva */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <Badge variant="brand" className="mb-4">
              <Gift size={11} /> {r.badge}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-verde-50 tracking-tight">
              {r.title1}
              <br />
              <span className="gradient-text">{r.title2}</span>
            </h1>
            <p className="text-lg text-verde-400 mt-5 max-w-md">{r.subtitle}</p>
            <p className="text-xs text-verde-600 mt-6">{r.secureNote}</p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <GiftCardVisual
              planLabel={selectedPlan?.nameIt ?? ''}
              monthsLabel={monthsLabel(months)}
            />
          </div>
        </div>

        {/* Compra */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 rounded-2xl border border-verde-900/40 bg-bg-dark-2/60 p-7">
            <h2 className="text-xl font-bold text-verde-50 mb-6 flex items-center gap-2">
              <Gift size={18} className="text-verde-400" /> {r.buyTitle}
            </h2>

            {/* Plan */}
            <label className="block text-xs font-semibold text-verde-500 mb-2">{r.planLabel}</label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {GIFT_PLANS.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setPlanId(plan.id)}
                  className={`rounded-xl border px-3 py-3 text-center transition-all ${
                    planId === plan.id
                      ? 'border-verde-500/80 bg-verde-950/60 text-verde-100'
                      : 'border-verde-900/50 bg-bg-dark/40 text-verde-500 hover:border-verde-700/60'
                  }`}
                >
                  <span className="block text-sm font-bold">{plan.nameIt}</span>
                  <span className="block text-[11px] mt-0.5">${plan.monthlyPrice}/mes</span>
                </button>
              ))}
            </div>

            {/* Duración */}
            <label className="block text-xs font-semibold text-verde-500 mb-2">{r.durationLabel}</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {MONTH_OPTIONS.map(m => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`rounded-xl border px-3 py-2.5 text-center transition-all ${
                    months === m
                      ? 'border-verde-500/80 bg-verde-950/60 text-verde-100'
                      : 'border-verde-900/50 bg-bg-dark/40 text-verde-500 hover:border-verde-700/60'
                  }`}
                >
                  <span className="block text-sm font-bold">{monthsLabel(m)}</span>
                  <span className="block text-[11px] mt-0.5">${priceFor(planId, m)}</span>
                </button>
              ))}
            </div>

            {/* Datos */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-verde-500 mb-1">{r.buyerEmail} *</label>
                <input type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-verde-500 mb-1">{r.buyerName}</label>
                <input value={buyerName} onChange={e => setBuyerName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-verde-500 mb-1">{r.recipientEmail}</label>
                <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-verde-500 mb-1">{r.recipientName}</label>
                <input value={recipientName} onChange={e => setRecipientName(e.target.value)} className={inputCls} />
              </div>
            </div>
            <p className="text-[11px] text-verde-600 mt-2">{r.recipientNote}</p>

            <div className="mt-4">
              <label className="block text-xs text-verde-500 mb-1">{r.messageLabel}</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={r.messagePh}
                rows={2}
                maxLength={300}
                className={inputCls}
              />
            </div>

            {buyError && <p className="mt-3 text-xs text-red-400">{buyError}</p>}

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <span className="block text-xs text-verde-500">{r.total}</span>
                <span className="text-2xl font-extrabold text-verde-50">${total} USD</span>
              </div>
              <Button
                size="lg"
                disabled={buying || !buyerEmail.trim()}
                onClick={buy}
                className="px-8"
              >
                {buying ? r.paying : r.payBtn}
              </Button>
            </div>
          </div>

          {/* Canje */}
          <div className="lg:col-span-2 rounded-2xl border border-verde-900/40 bg-bg-dark-2/60 p-7">
            <h2 className="text-xl font-bold text-verde-50 mb-2 flex items-center gap-2">
              <Ticket size={18} className="text-verde-400" /> {r.redeemTitle}
            </h2>
            <p className="text-sm text-verde-500 mb-5">{r.redeemSubtitle}</p>

            {isSignedIn ? (
              <>
                <input
                  value={redeemCode}
                  onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="ITAL-XXXX-XXXX-XXXX"
                  className={`${inputCls} font-mono tracking-widest text-center`}
                />
                {redeemResult && (
                  <p className={`mt-3 text-sm ${redeemResult.ok ? 'text-verde-400' : 'text-red-400'}`}>
                    {redeemResult.msg}
                  </p>
                )}
                <Button
                  className="w-full mt-4"
                  disabled={redeeming || redeemCode.trim().length < 10}
                  onClick={redeem}
                >
                  {redeeming ? r.redeeming : r.redeemBtn}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-verde-400 mb-4">{r.redeemLogin}</p>
                <Link href="/sign-up">
                  <Button className="w-full">{r.redeemLoginBtn}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
