'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  BrainCircuit, Loader2, CheckCircle2, XCircle,
  RotateCcw, Trophy, AlertTriangle,
} from 'lucide-react'
import type { TestQuestion, LessonProgressRow } from '@/types'

type ExamState = 'idle' | 'loading' | 'exam' | 'submitting' | 'result'

interface ResultInfo {
  score: number
  status: 'passed' | 'failed'
  label: string
  color: string
  icon: React.ReactNode
}

function getResult(score: number): ResultInfo {
  if (score >= 10) return {
    score, status: 'passed', label: 'Eccellente!',
    color: 'text-emerald-400', icon: <Trophy size={32} className="text-emerald-400" />,
  }
  if (score >= 9) return {
    score, status: 'passed', label: 'Ottimo!',
    color: 'text-green-400', icon: <CheckCircle2 size={32} className="text-green-400" />,
  }
  if (score >= 8) return {
    score, status: 'passed', label: 'Approvato',
    color: 'text-verde-400', icon: <CheckCircle2 size={32} className="text-verde-400" />,
  }
  return {
    score, status: 'failed', label: 'Non superato',
    color: 'text-red-400', icon: <XCircle size={32} className="text-red-400" />,
  }
}

interface LessonExamProps {
  slug: string
  initialProgress: Pick<LessonProgressRow, 'score' | 'status' | 'attempts'> | null
}

export function LessonExam({ slug, initialProgress }: LessonExamProps) {
  const [state, setState] = useState<ExamState>('idle')
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(initialProgress?.attempts ?? 0)

  const startExam = async () => {
    setState('loading')
    setError(null)
    try {
      const res = await fetch(`/api/lessons/${slug}/test`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar preguntas')
      setQuestions(data.questions)
      setAnswers({})
      setState('exam')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setState('idle')
    }
  }

  const submitExam = async () => {
    if (Object.keys(answers).length < questions.length) {
      setError('Devi rispondere a tutte le domande prima di inviare.')
      return
    }
    setState('submitting')
    setError(null)

    const score = questions.reduce((acc, q, i) => {
      const letter = answers[i]
      const correct = q.answer
      return acc + (letter === correct ? 1 : 0)
    }, 0)

    try {
      const res = await fetch(`/api/lessons/${slug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar progreso')

      setResult(getResult(data.score ?? score))
      setAttempts(data.attempts ?? attempts + 1)
      setState('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar progreso')
      setState('exam')
    }
  }

  const retry = () => {
    setResult(null)
    setQuestions([])
    setAnswers({})
    setState('idle')
  }

  // ── Idle state ──
  if (state === 'idle') {
    return (
      <div className="mt-10 rounded-2xl border border-verde-800/40 bg-verde-950/20 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-verde-900/50 flex items-center justify-center shrink-0">
            <BrainCircuit size={24} className="text-verde-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-verde-100 text-lg">Esame della lezione</h3>
            <p className="text-verde-500 text-sm mt-0.5">
              10 domande generate dall&apos;IA — ogni tentativo è diverso.
              {attempts > 0 && (
                <span className="ml-2 text-verde-600">
                  Tentativi: {attempts} · Miglior punteggio: {initialProgress?.score ?? 0}/10
                </span>
              )}
            </p>
          </div>
          <Button onClick={startExam} className="shrink-0">
            <BrainCircuit size={15} />
            {attempts > 0 ? 'Riprova esame' : 'Presenta esame'}
          </Button>
        </div>
        {initialProgress?.status === 'passed' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-verde-400 bg-verde-900/20 rounded-xl px-4 py-2.5">
            <CheckCircle2 size={16} />
            Lezione superata con {initialProgress.score}/10
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-2.5">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
      </div>
    )
  }

  // ── Loading state ──
  if (state === 'loading') {
    return (
      <div className="mt-10 rounded-2xl border border-verde-800/40 bg-verde-950/20 p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 size={32} className="animate-spin text-verde-500" />
          <div>
            <p className="font-semibold text-verde-200">Generando domande con l&apos;IA...</p>
            <p className="text-verde-600 text-sm mt-1">Attendi qualche secondo</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Result state ──
  if (state === 'result' && result) {
    return (
      <div className="mt-10 rounded-2xl border border-verde-800/40 bg-verde-950/20 p-6">
        <div className="flex flex-col items-center gap-4 text-center py-4">
          {result.icon}
          <div>
            <p className={`text-3xl font-extrabold ${result.color}`}>{result.score}/10</p>
            <p className={`text-xl font-bold mt-1 ${result.color}`}>{result.label}</p>
            <p className="text-verde-500 text-sm mt-2">
              {result.status === 'passed'
                ? 'Hai superato la lezione! Puoi continuare con la prossima.'
                : 'Non hai raggiunto il punteggio minimo (8/10). Rileggi la lezione e riprova.'}
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            {result.status === 'failed' && (
              <Button onClick={retry} variant="outline">
                <RotateCcw size={15} />
                Riprova
              </Button>
            )}
            {result.status === 'passed' && (
              <Button onClick={retry} variant="ghost" className="text-sm">
                <RotateCcw size={14} />
                Ritenta per migliorare
              </Button>
            )}
          </div>
        </div>

        {/* Show correct answers */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-verde-400 uppercase tracking-wide">Correzione</h4>
          {questions.map((q, i) => {
            const userAnswer = answers[i]
            const correct = q.answer
            const isCorrect = userAnswer === correct
            return (
              <div
                key={i}
                className={`rounded-xl p-3 border ${isCorrect ? 'border-verde-800/40 bg-verde-950/30' : 'border-red-800/40 bg-red-950/20'}`}
              >
                <p className="text-sm font-medium text-verde-200 mb-1">{i + 1}. {q.question}</p>
                <p className={`text-xs ${isCorrect ? 'text-verde-400' : 'text-red-400'}`}>
                  {isCorrect ? '✓' : '✗'} Tu: {userAnswer ? q.options.find(o => o.startsWith(userAnswer + ')')) ?? userAnswer : '—'}
                </p>
                {!isCorrect && (
                  <p className="text-xs text-verde-500 mt-0.5">
                    Corretta: {q.options.find(o => o.startsWith(correct + ')'))}
                  </p>
                )}
                {q.explanation && (
                  <p className="text-xs text-verde-600 mt-1 italic">{q.explanation}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Exam state ──
  const unanswered = questions.length - Object.keys(answers).length

  return (
    <div className="mt-10 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-verde-100 text-lg flex items-center gap-2">
          <BrainCircuit size={20} className="text-verde-400" />
          Esame — {questions.length} domande
        </h3>
        <span className="text-xs text-verde-600">
          {Object.keys(answers).length}/{questions.length} risposte
        </span>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div
            key={i}
            className="rounded-2xl border border-verde-900/30 bg-verde-950/20 p-4"
          >
            <p className="font-medium text-verde-200 text-sm mb-3">
              <span className="text-verde-500 mr-1.5">{i + 1}.</span>
              {q.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map(option => {
                const letter = option.charAt(0) // 'A', 'B', 'C', 'D'
                const selected = answers[i] === letter
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswers(prev => ({ ...prev, [i]: letter }))}
                    className={`text-left px-3 py-2.5 rounded-xl text-sm transition-all border ${
                      selected
                        ? 'border-verde-600 bg-verde-900/50 text-verde-100'
                        : 'border-verde-900/30 bg-verde-950/10 text-verde-400 hover:border-verde-800/50 hover:text-verde-300'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        {unanswered > 0 && (
          <p className="text-xs text-verde-600">
            {unanswered} domand{unanswered === 1 ? 'a' : 'e'} senza risposta
          </p>
        )}
        <Button
          onClick={submitExam}
          disabled={state === 'submitting'}
          className="ml-auto"
        >
          {state === 'submitting' ? (
            <><Loader2 size={14} className="animate-spin" /> Invio...</>
          ) : (
            'Invia risposte'
          )}
        </Button>
      </div>
    </div>
  )
}
