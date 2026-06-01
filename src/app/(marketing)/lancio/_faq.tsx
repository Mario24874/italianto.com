'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const FAQ_ITEMS = [
  {
    q: '¿Necesito experiencia previa en italiano?',
    a: 'No. Comenzamos desde cero (nivel A1) con pronunciación, alfabeto y vocabulario básico. El Tutor IA adapta el ritmo a tu nivel.',
  },
  {
    q: '¿En qué se diferencia de Duolingo?',
    a: 'Italianto tiene un Tutor IA conversacional real, lecciones en profundidad (no solo ejercicios de frases), y un ecosistema completo con apps especializadas como Dialoghi Studio e ItaliantoApp.',
  },
  {
    q: '¿Qué incluye el plan gratis?',
    a: 'Acceso básico: 3 diálogos por mes, conjugador de 20 verbos, traductor básico y contenido introductorio. Sin tarjeta de crédito requerida.',
  },
  {
    q: '¿Cómo aplico el descuento LANCIO10?',
    a: 'Al hacer clic en "Comprar plan", introduce el código LANCIO10 en el campo de código de promoción de Stripe. 10% de descuento en el primer pago. Válido solo hasta el 9 de junio.',
  },
  {
    q: '¿Hay contrato mínimo?',
    a: 'No. Suscripción mensual o anual. Cancela en cualquier momento desde tu panel de configuración sin penalización.',
  },
  {
    q: '¿Dialoghi Studio e ItaliantoApp cuestan extra?',
    a: 'No, están incluidas en los planes Avanzado y Maestro sin costo adicional.',
  },
]

function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-verde-800/30 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-verde-950/40 transition-colors"
      >
        <span className="text-base font-semibold text-verde-100">{question}</span>
        <ChevronDown
          size={18}
          className={`text-verde-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-5 text-sm text-verde-400 leading-relaxed border-t border-verde-800/20">
              <div className="pt-4">{answer}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  function toggle(i: number) {
    setOpenIndex(prev => (prev === i ? null : i))
  }

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/40 to-transparent" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="brand" className="mb-4">
            Preguntas frecuentes
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-50 tracking-tight">
            ¿Tienes{' '}
            <span className="gradient-text">dudas?</span>
          </h2>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem
              key={i}
              question={item.q}
              answer={item.a}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
