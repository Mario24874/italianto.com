'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, X, Zap, Crown } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { formatCurrency } from '@/lib/utils'

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="precios" className="py-24 relative overflow-hidden bg-bg-dark-2/30">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/30 to-transparent" />

      {/* Background decorative */}
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
              Precios
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-4 tracking-tight">
              Elige tu plan,
              <br />
              <span className="gradient-text">empieza hoy</span>
            </h2>
            <p className="text-lg text-verde-400 max-w-xl mx-auto mb-8">
              Comienza gratis y actualiza cuando lo necesites. Sin contratos, cancela cuando quieras.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-verde-950/60 border border-verde-900/50 rounded-2xl p-1.5">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  !isAnnual
                    ? 'bg-verde-800/60 text-verde-100 shadow-sm'
                    : 'text-verde-500 hover:text-verde-400'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  isAnnual
                    ? 'bg-verde-800/60 text-verde-100 shadow-sm'
                    : 'text-verde-500 hover:text-verde-400'
                }`}
              >
                Anual
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
            const period = isAnnual ? '/año' : '/mes'
            const monthlyEquiv = isAnnual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice

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
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                {plan.id === 'maestro' && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center z-10">
                    <Badge variant="premium" className="shadow-brand border-amber-400/60">
                      <Crown size={11} />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div
                  className={`h-full rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    plan.highlighted
                      ? 'border-verde-600/60 bg-gradient-to-b from-verde-950/80 to-bg-dark-2 shadow-brand'
                      : plan.id === 'maestro'
                      ? 'border-amber-700/40 bg-gradient-to-b from-amber-950/30 to-bg-dark-2'
                      : 'border-verde-900/40 bg-bg-dark-2/60'
                  }`}
                >
                  {/* Plan Header */}
                  <div className="mb-6">
                    <div className="text-xs font-bold uppercase tracking-widest text-verde-500 mb-1">
                      {plan.nameIt}
                    </div>
                    <div className="text-verde-200 font-medium text-sm mb-4">
                      {plan.description}
                    </div>
                    <div className="flex items-end gap-1">
                      {price === 0 ? (
                        <span className="text-4xl font-extrabold text-verde-50">Gratis</span>
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
                        ≈ {formatCurrency(monthlyEquiv, 'USD')}/mes
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {plan.features.map(feat => (
                      <li key={feat} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-verde-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-verde-300">{feat}</span>
                      </li>
                    ))}
                    {/* Limites no incluidos */}
                    {plan.id === 'free' && (
                      <>
                        <li className="flex items-start gap-2 opacity-40">
                          <X size={14} className="mt-0.5 shrink-0 text-red-500" />
                          <span className="text-sm text-verde-500 line-through">Tutor AI</span>
                        </li>
                        <li className="flex items-start gap-2 opacity-40">
                          <X size={14} className="mt-0.5 shrink-0 text-red-500" />
                          <span className="text-sm text-verde-500 line-through">Audio generado</span>
                        </li>
                      </>
                    )}
                  </ul>

                  {/* CTA */}
                  <Button
                    variant={plan.highlighted ? 'default' : plan.id === 'maestro' ? 'gradient' : 'outline'}
                    className="w-full"
                    asChild
                  >
                    <Link
                      href={plan.id === 'free' ? '/sign-up' : `/sign-up?plan=${plan.id}&billing=${isAnnual ? 'annual' : 'monthly'}`}
                    >
                      {plan.id === 'free' ? 'Comenzar gratis' : `Elegir ${plan.name}`}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>

        <p className="text-center text-xs text-verde-600 mt-8">
          Todos los planes incluyen acceso a ItaliantoApp y Dialogue Studio.
          Sin cargos ocultos. Cancela en cualquier momento.
        </p>
      </div>
    </section>
  )
}
