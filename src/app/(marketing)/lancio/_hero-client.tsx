'use client'

import { motion } from 'framer-motion'
import { Users, BookOpen, Star, Zap } from 'lucide-react'

const STATS = [
  { icon: Users, value: '10K+', label: 'Estudiantes' },
  { icon: BookOpen, value: '3', label: 'Apps' },
  { icon: Star, value: '4.9★', label: 'Valoración' },
  { icon: Zap, value: '100+', label: 'Lecciones' },
]

export function HeroClient() {
  return (
    <motion.div
      className="flex flex-wrap gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      {STATS.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-verde-950/60 border border-verde-800/50 flex items-center justify-center">
            <Icon size={16} className="text-verde-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-verde-100 leading-none">{value}</div>
            <div className="text-xs text-verde-500 mt-0.5">{label}</div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}
