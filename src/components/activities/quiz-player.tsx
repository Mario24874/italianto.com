'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export type QuizQuestion = {
  text: string
  options: string[]
  correct: number
  explanation?: string
}

export type QuizContent = {
  questions: QuizQuestion[]
  passingScore?: number
}

export function QuizPlayer({ content }: { content: QuizContent }) {
  const { t } = useLanguage()
  const qt = t.quiz
  const { questions, passingScore = 60 } = content
  const total = questions.length

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [done, setDone] = useState(false)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-verde-700 text-sm">
        {qt.noQuestions}
      </div>
    )
  }

  const q = questions[current]
  const score = answers.filter(Boolean).length

  function choose(idx: number) {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
  }

  function next() {
    const correct = selected === q.correct
    const newAnswers = [...answers, correct]
    if (current + 1 >= total) {
      setAnswers(newAnswers)
      setDone(true)
    } else {
      setAnswers(newAnswers)
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  function reset() {
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setAnswers([])
    setDone(false)
  }

  if (done) {
    const pct = Math.round((score / total) * 100)
    const passed = pct >= passingScore
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-5">
        <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 ${
          passed ? 'border-verde-400 bg-verde-950/50' : 'border-red-500/50 bg-red-950/30'
        }`}>
          <span className={`text-2xl font-extrabold ${passed ? 'text-verde-300' : 'text-red-300'}`}>
            {pct}%
          </span>
          <Trophy size={14} className={passed ? 'text-amber-400 mt-0.5' : 'text-red-600 mt-0.5'} />
        </div>
        <div>
          <p className="text-lg font-bold text-verde-100">{passed ? qt.passed : qt.failed}</p>
          <p className="text-sm text-verde-500 mt-1">{score} {qt.outOf} {total} {qt.correct}</p>
          {!passed && (
            <p className="text-xs text-verde-600 mt-1">{qt.passNeeded} {passingScore}{qt.toPass}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors"
        >
          <RotateCcw size={14} />
          {qt.retry}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-verde-600 shrink-0">{current + 1}/{total}</span>
        <div className="flex-1 flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                i < current
                  ? answers[i] ? 'bg-verde-400' : 'bg-red-500/70'
                  : i === current ? 'bg-amber-400' : 'bg-verde-900'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <p className="text-verde-100 font-semibold text-base leading-relaxed">{q.text}</p>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i)
          let cls = 'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-3 '
          if (!revealed) {
            cls += selected === i
              ? 'border-amber-500 bg-amber-950/30 text-amber-200'
              : 'border-verde-800/40 bg-verde-950/30 text-verde-300 hover:border-verde-600 hover:bg-verde-950/50 cursor-pointer'
          } else {
            if (i === q.correct) cls += 'border-verde-400 bg-verde-950/50 text-verde-200 font-medium'
            else if (i === selected && i !== q.correct) cls += 'border-red-500/60 bg-red-950/20 text-red-300'
            else cls += 'border-verde-900/20 bg-transparent text-verde-700 opacity-50'
          }
          return (
            <button key={i} onClick={() => choose(i)} disabled={revealed} className={cls}>
              <span className="shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                {revealed && i === q.correct
                  ? <CheckCircle2 size={13} className="text-verde-400" />
                  : revealed && i === selected
                  ? <XCircle size={13} className="text-red-400" />
                  : letter}
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* Explanation + Next */}
      {revealed && (
        <div className="flex flex-col gap-3 mt-1">
          {q.explanation && (
            <div className="rounded-xl bg-amber-950/20 border border-amber-800/30 px-4 py-3 text-xs text-amber-300 leading-relaxed">
              {q.explanation}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={next}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors"
            >
              {current + 1 >= total ? qt.results : qt.next}
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
