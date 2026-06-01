'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  )
}

function MockTutorChat() {
  return (
    <div className="bg-verde-950/40 border border-verde-800/30 rounded-2xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-verde-800/30 bg-verde-950/40">
        <div className="relative">
          <Image
            src="/tutor-Giulia.png"
            alt="Giulia"
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-verde-950" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-verde-100">Tutor IA — Giulia</div>
          <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            En vivo
          </div>
        </div>
        <Badge variant="info" className="text-[10px]">IA</Badge>
      </div>

      {/* Chat messages */}
      <div className="p-4 space-y-3 min-h-[200px]">
        {/* Giulia message */}
        <div className="flex items-start gap-2">
          <Image src="/tutor-Giulia.png" alt="Giulia" width={24} height={24} className="rounded-full object-cover mt-0.5 shrink-0" />
          <div className="bg-verde-900/60 border border-verde-800/40 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
            <p className="text-xs text-verde-200 leading-relaxed">
              Ciao! Come stai oggi? 😊 Pronti a praticare il nostro italiano?
            </p>
          </div>
        </div>

        {/* User message */}
        <div className="flex items-start gap-2 justify-end">
          <div className="bg-verde-700/40 border border-verde-600/30 rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%]">
            <p className="text-xs text-verde-100 leading-relaxed">
              Ciao Giulia! Sto bene, grazie! Voglio imparare i verbi.
            </p>
          </div>
        </div>

        {/* Giulia message 2 */}
        <div className="flex items-start gap-2">
          <Image src="/tutor-Giulia.png" alt="Giulia" width={24} height={24} className="rounded-full object-cover mt-0.5 shrink-0" />
          <div className="bg-verde-900/60 border border-verde-800/40 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
            <p className="text-xs text-verde-200 leading-relaxed">
              Ottimo! 🎉 Iniziamo con &apos;essere&apos; e &apos;avere&apos; — i verbi più importanti...
            </p>
          </div>
        </div>

        {/* Typing indicator */}
        <div className="flex items-start gap-2">
          <Image src="/tutor-Giulia.png" alt="Giulia" width={24} height={24} className="rounded-full object-cover mt-0.5 shrink-0" />
          <div className="bg-verde-900/60 border border-verde-800/40 rounded-xl rounded-tl-sm">
            <TypingDots />
          </div>
        </div>
      </div>

      {/* Action chips */}
      <div className="flex gap-2 px-4 pb-4 flex-wrap">
        {['🎤 Hablar', '✍️ Escribir', '📖 Traducir'].map(chip => (
          <button
            key={chip}
            className="text-[11px] font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded-full px-3 py-1 hover:bg-cyan-900/40 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}

function MockLessonViewer() {
  return (
    <div className="bg-verde-950/40 border border-verde-800/30 rounded-2xl backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-verde-800/30 bg-verde-950/40 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-verde-100">Lezione 1: L&apos;Alfabeto Italiano</div>
        </div>
        <Badge variant="success" className="text-[10px]">A1 Principiante</Badge>
      </div>
      <div className="px-4 py-3 space-y-3">
        {/* Lang tabs */}
        <div className="flex gap-1.5">
          {['ES', 'IT', 'EN'].map((lang, i) => (
            <button
              key={lang}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                i === 0
                  ? 'bg-verde-800/60 border-verde-600/50 text-verde-200'
                  : 'border-verde-800/30 text-verde-600 hover:text-verde-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Content preview */}
        <p className="text-xs text-verde-300 leading-relaxed line-clamp-3">
          El italiano tiene 21 letras. El alfabeto italiano es similar al español con algunas diferencias clave: las letras J, K, W, X, Y no son nativas del italiano...
        </p>

        {/* Audio player */}
        <div className="bg-verde-900/50 border border-verde-800/30 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-verde-300 font-medium">🔊 L&apos;Alfabeto</span>
            <span className="text-[10px] text-verde-600 ml-auto">2:30</span>
          </div>
          <div className="relative h-1.5 bg-verde-900 rounded-full">
            <div className="absolute left-0 top-0 h-full w-2/5 bg-verde-500 rounded-full" />
            <div className="absolute h-3 w-3 bg-verde-400 rounded-full top-1/2 -translate-y-1/2 border-2 border-verde-950 shadow" style={{ left: 'calc(40% - 6px)' }} />
          </div>
        </div>

        {/* Exercise progress */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-verde-400">📝 Ejercicios:</span>
          <span className="font-semibold text-verde-200">3/5 completados</span>
          <span className="text-green-400">✅</span>
        </div>
      </div>
    </div>
  )
}

function MockCanzoni() {
  return (
    <div className="bg-verde-950/40 border border-verde-800/30 rounded-2xl backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-verde-800/30 bg-verde-950/40 flex items-center justify-between">
        <div className="text-sm font-semibold text-verde-100">🎵 Canzoni Italiane</div>
        <input
          readOnly
          value="Buscar..."
          className="text-[10px] bg-verde-900/40 border border-verde-800/30 rounded-lg px-2.5 py-1 text-verde-600 w-24 cursor-default"
        />
      </div>
      <div className="px-4 py-3 space-y-3">
        {/* Now playing */}
        <div className="bg-gradient-to-r from-pink-950/40 to-purple-950/30 border border-pink-800/30 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">Reproduciendo</span>
          </div>
          <div className="text-sm font-semibold text-verde-100">Volare</div>
          <div className="text-[11px] text-verde-400">Domenico Modugno</div>
        </div>

        {/* Lyrics */}
        <div className="space-y-1">
          <p className="text-xs text-verde-200 font-medium">Volare, oh oh</p>
          <p className="text-xs text-verde-200 font-medium">Cantare, oh oh oh oh</p>
          <p className="text-[10px] text-verde-600 italic">Volar, oh oh / Cantar, oh oh oh oh</p>
        </div>

        {/* Progress */}
        <div>
          <div className="relative h-1 bg-verde-900 rounded-full mb-1.5">
            <div className="absolute left-0 top-0 h-full w-1/3 bg-pink-500 rounded-full" />
          </div>
          <div className="flex justify-between text-[10px] text-verde-600">
            <span>1:24</span>
            <span>3:42</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5">
          {['◀', '⏸', '▶'].map(ctrl => (
            <button key={ctrl} className="w-7 h-7 flex items-center justify-center rounded-full text-verde-400 hover:text-verde-200 hover:bg-verde-900/40 transition-colors text-sm">
              {ctrl}
            </button>
          ))}
          <span className="ml-2 text-xs text-verde-600">🔊</span>
        </div>
      </div>
    </div>
  )
}

function MockPassatempi() {
  const grid = [
    ['C', 'A', 'S', 'A', ''],
    ['', 'M', '', '', ''],
    ['', 'O', '', '', ''],
    ['', 'R', '', '', ''],
    ['', 'E', '', '', ''],
  ]

  return (
    <div className="bg-verde-950/40 border border-verde-800/30 rounded-2xl backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-verde-800/30 bg-verde-950/40 flex items-center justify-between">
        <div className="text-sm font-semibold text-verde-100">🎮 Passatempi — Cruciverba</div>
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold">
          🏆 +50 punti
        </div>
      </div>
      <div className="px-4 py-3 space-y-3">
        {/* Grid */}
        <div className="grid grid-cols-5 gap-1 w-fit mx-auto">
          {grid.map((row, ri) =>
            row.map((cell, ci) => (
              <div
                key={`${ri}-${ci}`}
                className={`w-7 h-7 flex items-center justify-center rounded text-[11px] font-bold border ${
                  cell
                    ? 'bg-verde-800/60 border-verde-600/50 text-verde-100'
                    : 'bg-verde-950/40 border-verde-800/20 text-verde-800'
                }`}
              >
                {cell || '·'}
              </div>
            ))
          )}
        </div>

        {/* Clue */}
        <div className="bg-verde-900/40 border border-verde-800/30 rounded-lg px-3 py-2">
          <div className="text-[10px] text-verde-500 mb-0.5">Pista 1↓</div>
          <div className="text-xs text-verde-300">Luogo dove si vive</div>
          <div className="text-[11px] text-verde-500 mt-0.5">→ <span className="text-verde-300 font-semibold">CASA</span></div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-[10px] text-verde-500 mb-1">
            <span>Progreso</span>
            <span className="text-verde-300 font-semibold">4/8 palabras</span>
          </div>
          <div className="relative h-1.5 bg-verde-900 rounded-full">
            <div className="absolute left-0 top-0 h-full w-1/2 bg-verde-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function MockDemo() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="brand" className="mb-4">
            Plataforma completa
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-4 tracking-tight">
            Descubre la{' '}
            <span className="gradient-text">plataforma</span>
          </h2>
          <p className="text-lg text-verde-400 max-w-2xl mx-auto">
            Todo lo que necesitas para hablar italiano, en un solo lugar.
          </p>
        </motion.div>

        {/* Mocks grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tutor IA — large card */}
          <motion.div
            className="lg:row-span-1"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-verde-500">Tutor IA Personal</span>
            </div>
            <MockTutorChat />
          </motion.div>

          {/* Lesson viewer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-verde-500">Lecciones Estructuradas</span>
            </div>
            <MockLessonViewer />
          </motion.div>

          {/* Canzoni */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-verde-500">Canzoni Italiane</span>
            </div>
            <MockCanzoni />
          </motion.div>

          {/* Passatempi */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-verde-500">Passatempi — Juegos</span>
            </div>
            <MockPassatempi />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
