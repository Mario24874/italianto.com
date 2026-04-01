'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/contexts/language-context'
import { Badge } from '@/components/ui/badge'
import { Wrench } from 'lucide-react'

interface UnderConstructionProps {
  sectionName: string
}

export function UnderConstruction({ sectionName }: UnderConstructionProps) {
  const { lang, t } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* Image with overlay */}
      <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden mb-8 border border-verde-900/40 shadow-2xl">
        <Image
          src="/images/media/img/IGCQV.jpg"
          alt="En construcción"
          fill
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-transparent" />

        {/* Animated badge over image */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Badge variant="warning" className="gap-1.5 px-3 py-1 text-xs font-bold shadow-lg">
              <Wrench size={11} />
              {t.underConstruction.badge}
            </Badge>
          </motion.div>
        </div>

        {/* Section name over image */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-extrabold text-verde-100 drop-shadow-lg"
          >
            {sectionName}
          </motion.span>
        </div>
      </div>

      {/* Animated text that responds to language selection */}
      <AnimatePresence mode="wait">
        <motion.div
          key={lang}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-extrabold text-verde-50">
            {t.underConstruction.title}
          </h2>
          <p className="text-verde-400 max-w-sm text-sm leading-relaxed">
            {t.underConstruction.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
