'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/language-context'

function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-verde-200 dark:border-verde-800/30 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-verde-50 dark:hover:bg-verde-950/40 transition-colors"
      >
        <span className="text-base font-semibold text-verde-800 dark:text-verde-100">{question}</span>
        <ChevronDown
          size={18}
          className={`text-verde-600 dark:text-verde-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
            <div className="px-6 pb-5 text-sm text-verde-700 dark:text-verde-400 leading-relaxed border-t border-verde-100 dark:border-verde-800/20">
              <div className="pt-4">{answer}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const { t } = useLanguage()
  const faq = t.lancio.faq

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
            {faq.badge}
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-900 dark:text-verde-50 tracking-tight">
            {faq.title}{' '}
            <span className="gradient-text">{faq.highlight}</span>
          </h2>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {faq.items.map((item, i) => (
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
