'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, X, Zap, Crown } from 'lucide-react'
import { PLANS, type PlanType } from '@/lib/plans'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { isSignedIn } = useUser()
  const router = useRouter()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useLanguage()

  const planTranslations = t.pricing.plans

  async function handlePlanClick(planId: string) {
    if (planId === 'free') {
      router.push('/sign-up')
      return
    }
    const billing = isAnnual ? 'annual' : 'monthly'
    if (!isSignedIn) {
      router.push(`/sign-up?plan=${planId}&billing=${billing}`)
      return
    }
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: planId, billingInterval: isAnnual ? 'year' : 'month' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout error:', data.error)
        alert(`Error al procesar el pago: ${data.error}`)
      }
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <section id="precios" className="py-24 relative overflow-hidden bg-bg-light-2/30 dark:bg-bg-dark-2/30">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/30 to-transparent" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(ellipse, #2e7d32 0%, transparent 70%)' }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={ref} className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="brand" className="mb-4">
              {t.pricing.badge}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-4 tracking-tight">
              {t.pricing.title1}
              <br />
              <span className="gradient-text">{t.pricing.title2}</span>
            </h2>
            <p className="text-lg text-verde-400 max-w-xl mx-auto mb-8">
              {t.pricing.subtitle}
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-verde-100/60 dark:bg-verde-950/60 border border-verde-300/50 dark:border-verde-900/50 rounded-2xl p-1.5">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  !isAnnual
                    ? 'bg-verde-200/80 dark:bg-verde-800/60 text-verde-900 dark:text-verde-100 shadow-sm'
                    : 'text-verde-600 dark:text-verde-500 hover:text-verde-700 dark:hover:text-verde-400'
                }`}
              >
                {t.pricing.monthly}
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  isAnnual
                    ? 'bg-verde-200/80 dark:bg-verde-800/60 text-verde-900 dark:text-verde-100 shadow-sm'
                    : 'text-verde-600 dark:text-verde-500 hover:text-verde-700 dark:hover:text-verde-400'
                }`}
              >
                {t.pricing.annual}
                <span className="text-[10px] bg-verde-700/60 text-verde-300 px-1.5 py-0.5 rounded-full">
                  -30%
                </span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
            const period = isAnnual ? t.pricing.perYear : t.pricing.perMonth
            const monthlyEquiv = isAnnual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice
            const planT = planTranslations[plan.id as PlanType]

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center z-10">
                    <Badge variant="premium" className="shadow-brand">
                      <Zap size={11} />
                      {t.pricing.popular}
                    </Badge>
                  </div>
                )}
                {plan.id === 'maestro' && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center z-10">
                    <Badge variant="premium" className="shadow-brand border-amber-400/60">
                      <Crown size={11} />
                      {t.pricing.allIncluded}
                    </Badge>
                  </div>
                )}

                <div
                  className={`h-full rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    plan.highlighted
                      ? 'border-verde-600/60 bg-gradient-to-b from-verde-100/80 dark:from-verde-950/80 to-bg-light-2 dark:to-bg-dark-2 shadow-brand'
                      : plan.id === 'maestro'
                      ? 'border-amber-700/40 bg-gradient-to-b from-amber-50/80 dark:from-amber-950/30 to-bg-light-2 dark:to-bg-dark-2'
                      : 'border-verde-200/40 dark:border-verde-900/40 bg-bg-light-2/60 dark:bg-bg-dark-2/60'
                  }`}
                >
                  {/* Plan Header */}
                  <div className="mb-6">
                    <div className="text-xs font-bold uppercase tracking-widest text-verde-500 mb-1">
                      {plan.nameIt}
                    </div>
                    <div className="text-verde-200 font-medium text-sm mb-4">
                      {planT.description}
                    </div>
                    <div className="flex items-end gap-1">
                      {price === 0 ? (
                        <span className="text-4xl font-extrabold text-verde-50">{t.pricing.free}</span>
                      ) : (
                        <>
                          <span className="text-4xl font-extrabold text-verde-50">
                            {formatCurrency(price, 'USD')}
                          </span>
                          <span className="text-verde-500 text-sm mb-1.5">{period}</span>
                        </>
                      )}
                    </div>
                    {isAnnual && price > 0 && (
                      <div className="text-xs text-verde-500 mt-1">
                        ≈ {formatCurrency(monthlyEquiv, 'USD')}{t.pricing.approxPerMonth}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {planT.features.map(feat => (
                      <li key={feat} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-verde-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-verde-300">{feat}</span>
                      </li>
                    ))}
                    {plan.id === 'free' && (
                      <>
                        <li className="flex items-start gap-2 opacity-40">
                          <X size={14} className="mt-0.5 shrink-0 text-red-500" />
                          <span className="text-sm text-verde-500 line-through">{t.pricing.tutor}</span>
                        </li>
                        <li className="flex items-start gap-2 opacity-40">
                          <X size={14} className="mt-0.5 shrink-0 text-red-500" />
                          <span className="text-sm text-verde-500 line-through">{t.pricing.audio}</span>
                        </li>
                      </>
                    )}
                  </ul>

                  {/* CTA */}
                  <Button
                    variant={plan.highlighted ? 'default' : plan.id === 'maestro' ? 'gradient' : 'outline'}
                    className="w-full"
                    disabled={loadingPlan === plan.id}
                    onClick={() => handlePlanClick(plan.id)}
                  >
                    {loadingPlan === plan.id
                      ? 'Redirigiendo...'
                      : plan.id === 'free'
                        ? t.pricing.startFree
                        : `${t.pricing.choose} ${t.pricing.plans[plan.id as keyof typeof t.pricing.plans].name}`}
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>

        <p className="text-center text-xs text-verde-600 mt-8">
          {t.pricing.footer}
        </p>
      </div>
    </section>
  )
}
