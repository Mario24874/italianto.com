'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Eye, EyeOff, ChevronRight } from 'lucide-react'
import type { Exercise, ExerciseFillBlank, ExerciseChoice, ExerciseDialogue, ExerciseFreeWrite, ExerciseTranslations } from '@/types'
import { useLanguage } from '@/contexts/language-context'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

// Remove ___id___ placeholders from fill_blank labels (Gemini sometimes puts them there)
function cleanLabel(label: string) {
  return label.replace(/___\w+___/g, '[ ]')
}

function answersMatch(correct: string, user: string): boolean {
  const c = normalize(correct)
  const u = normalize(user)
  if (!u) return false
  return c === u || c.includes(u) || u.includes(c)
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  const { t } = useLanguage()
  const tEx = t.lessons.exercisesUi
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="rounded-xl border border-verde-900/30 bg-verde-950/10 p-4 mb-2">
      <div className="flex justify-between text-xs font-semibold text-verde-500 mb-2">
        <span>{tEx.progress}</span>
        <span className="text-verde-400">{done} / {total} {tEx.completed}</span>
      </div>
      <div className="h-2 bg-verde-950/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-verde-600 to-verde-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Section Divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-verde-900/40" />
      <span className="text-sm font-bold text-verde-400 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-verde-900/40" />
    </div>
  )
}

// ─── Result Box ───────────────────────────────────────────────────────────────

function ResultBox({ correct, total }: { correct: number; total: number }) {
  const { t } = useLanguage()
  const tEx = t.lessons.exercisesUi
  const of_ = tEx.resultOf
  const cor = tEx.resultCorrect
  if (correct === total) return (
    <div className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-green-950/40 border border-green-700/40 text-green-400 text-sm font-semibold">
      <CheckCircle2 size={16} /> {tEx.resultPerfect} {correct} {of_} {total} {cor}.
    </div>
  )
  if (correct === 0) return (
    <div className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-red-950/30 border border-red-700/40 text-red-400 text-sm font-semibold">
      <XCircle size={16} /> {tEx.resultNone}
    </div>
  )
  return (
    <div className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-yellow-950/30 border border-yellow-700/40 text-yellow-400 text-sm font-semibold">
      <CheckCircle2 size={16} /> {correct} {of_} {total} {cor}. {tEx.resultAlmost}
    </div>
  )
}

// ─── Fill Blank Exercise ──────────────────────────────────────────────────────

function FillBlankExercise({
  ex,
  onComplete,
}: {
  ex: ExerciseFillBlank
  onComplete: (score: number) => void
}) {
  const { t } = useLanguage()
  const tEx = t.lessons.exercisesUi
  const [values, setValues] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)

  const results = checked
    ? ex.items.map(item => answersMatch(item.answer, values[item.id] ?? ''))
    : null

  const correct = results ? results.filter(Boolean).length : 0

  const verify = () => {
    setChecked(true)
    onComplete(correct / ex.items.length)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {ex.items.map((item, idx) => {
          const ok = results?.[idx]
          return (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-verde-950/20 border border-verde-900/20 hover:border-verde-800/40 transition-colors">
              <span className="text-sm text-verde-300 font-medium min-w-0 flex-shrink-0" style={{ minWidth: '120px' }}>
                {cleanLabel(item.label)}
              </span>
              <input
                type="text"
                value={values[item.id] ?? ''}
                onChange={e => setValues(v => ({ ...v, [item.id]: e.target.value }))}
                disabled={checked}
                placeholder={item.placeholder ?? 'risposta...'}
                className={[
                  'flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm border transition-colors bg-verde-950/40 outline-none',
                  checked
                    ? ok
                      ? 'border-green-600/60 text-green-300 bg-green-950/30'
                      : 'border-red-600/60 text-red-300 bg-red-950/30'
                    : 'border-verde-800/40 text-verde-200 focus:border-verde-500',
                ].join(' ')}
              />
              {checked && (ok
                ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                : <XCircle size={16} className="text-red-400 shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {!checked && (
          <button onClick={verify}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors">
            <CheckCircle2 size={14} /> {tEx.verify}
          </button>
        )}
        {ex.answerPanel && (
          <button onClick={() => setShowAnswers(s => !s)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-verde-800/40 text-verde-500 hover:text-verde-300 text-sm transition-colors">
            {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAnswers ? tEx.hideAnswers : tEx.showAnswers}
          </button>
        )}
      </div>

      {checked && <ResultBox correct={correct} total={ex.items.length} />}

      {showAnswers && ex.answerPanel && (
        <div className="rounded-xl bg-verde-950/30 border border-verde-800/30 p-3 space-y-1">
          <p className="text-xs font-bold text-verde-400 uppercase tracking-wide mb-2">{tEx.correctAnswers}</p>
          {ex.answerPanel.map((line, i) => (
            <p key={i} className="text-xs text-verde-400 flex items-center gap-1.5">
              <ChevronRight size={10} className="text-verde-600 shrink-0" />{line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Choice Exercise ──────────────────────────────────────────────────────────

function ChoiceExercise({
  ex,
  onComplete,
}: {
  ex: ExerciseChoice
  onComplete: (score: number) => void
}) {
  const { t } = useLanguage()
  const tEx = t.lessons.exercisesUi
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [groupSelected, setGroupSelected] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)

  const isFlat = !!ex.options
  const isGrouped = !!ex.questions

  const toggleFlat = (value: string) => {
    if (checked) return
    if (ex.multiSelect) {
      setSelected(s => { const n = new Set(s); n.has(value) ? n.delete(value) : n.add(value); return n })
    } else {
      setSelected(new Set([value]))
    }
  }

  const selectGroup = (qId: string, value: string) => {
    if (checked) return
    setGroupSelected(g => ({ ...g, [qId]: value }))
  }

  const verify = () => {
    setChecked(true)
    let correct = 0; let total = 0

    if (isFlat && ex.options) {
      const correctValues = new Set(ex.options.filter(o => o.correct).map(o => o.value))
      total = correctValues.size
      for (const v of correctValues) { if (selected.has(v)) correct++ }
      if (ex.multiSelect) {
        for (const v of selected) { if (!correctValues.has(v)) correct-- }
        correct = Math.max(0, correct)
        total = correctValues.size
      }
    } else if (isGrouped && ex.questions) {
      total = ex.questions.length
      for (const q of ex.questions) {
        const picked = groupSelected[q.id]
        const correctOpt = q.options.find(o => o.correct)
        if (picked && correctOpt && picked === correctOpt.value) correct++
      }
    }

    onComplete(total > 0 ? correct / total : 0)
  }

  const getFlatState = (value: string) => {
    if (!checked) return selected.has(value) ? 'selected' : 'idle'
    const opt = ex.options?.find(o => o.value === value)
    if (!opt) return 'idle'
    if (opt.correct) return 'correct'
    if (selected.has(value) && !opt.correct) return 'wrong'
    return 'idle'
  }

  const getGroupState = (qId: string, value: string) => {
    if (!checked) return groupSelected[qId] === value ? 'selected' : 'idle'
    const q = ex.questions?.find(q => q.id === qId)
    const opt = q?.options.find(o => o.value === value)
    if (!opt) return 'idle'
    if (opt.correct) return 'correct'
    if (groupSelected[qId] === value && !opt.correct) return 'wrong'
    return 'idle'
  }

  const stateClass = (state: string) => {
    switch (state) {
      case 'selected': return 'border-blue-500/70 bg-blue-950/40 text-blue-300'
      case 'correct': return 'border-green-600/60 bg-green-950/30 text-green-300'
      case 'wrong': return 'border-red-600/60 bg-red-950/30 text-red-400'
      default: return 'border-verde-800/30 bg-verde-950/20 text-verde-300 hover:border-verde-600/50 hover:bg-verde-900/20'
    }
  }

  let correct = 0; let total = 0
  if (checked) {
    if (isFlat && ex.options) {
      const correctValues = new Set(ex.options.filter(o => o.correct).map(o => o.value))
      total = correctValues.size
      for (const v of correctValues) { if (selected.has(v)) correct++ }
      if (ex.multiSelect) { for (const v of selected) { if (!correctValues.has(v)) correct-- }; correct = Math.max(0, correct) }
    } else if (isGrouped && ex.questions) {
      total = ex.questions.length
      for (const q of ex.questions) {
        if (groupSelected[q.id] && q.options.find(o => o.correct)?.value === groupSelected[q.id]) correct++
      }
    }
  }

  return (
    <div className="space-y-3">
      {isFlat && ex.options && (
        <div className="flex flex-wrap gap-2">
          {ex.options.map(opt => (
            <button key={opt.value} type="button" onClick={() => toggleFlat(opt.value)}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${stateClass(getFlatState(opt.value))}`}>
              {opt.value}
            </button>
          ))}
        </div>
      )}

      {isGrouped && ex.questions && (
        <div className="space-y-3">
          {ex.questions.map(q => (
            <div key={q.id}>
              <p className="text-sm font-semibold text-verde-200 mb-2">{q.text}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map(opt => (
                  <button key={opt.value} type="button" onClick={() => selectGroup(q.id, opt.value)}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${stateClass(getGroupState(q.id, opt.value))}`}>
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {!checked && (
          <button onClick={verify}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors">
            <CheckCircle2 size={14} /> {tEx.verify}
          </button>
        )}
        {ex.answerPanel && (
          <button onClick={() => setShowAnswers(s => !s)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-verde-800/40 text-verde-500 hover:text-verde-300 text-sm transition-colors">
            {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAnswers ? tEx.hideAnswers : tEx.showAnswers}
          </button>
        )}
      </div>

      {checked && <ResultBox correct={correct} total={total} />}

      {showAnswers && ex.answerPanel && (
        <div className="rounded-xl bg-verde-950/30 border border-verde-800/30 p-3 space-y-1">
          <p className="text-xs font-bold text-verde-400 uppercase tracking-wide mb-2">{tEx.correctAnswers}</p>
          {ex.answerPanel.map((line, i) => (
            <p key={i} className="text-xs text-verde-400 flex items-center gap-1.5">
              <ChevronRight size={10} className="text-verde-600 shrink-0" />{line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Dialogue Exercise ────────────────────────────────────────────────────────

function parseDialogueLine(text: string): { type: 'text' | 'blank'; content: string }[] {
  const parts = text.split(/(___\w+___)/g)
  return parts.map(p => {
    if (/^___\w+___$/.test(p)) return { type: 'blank' as const, content: p.slice(3, -3) }
    return { type: 'text' as const, content: p }
  }).filter(p => p.content !== '')
}

function DialogueExercise({
  ex,
  onComplete,
}: {
  ex: ExerciseDialogue
  onComplete: (score: number) => void
}) {
  const { t } = useLanguage()
  const tEx = t.lessons.exercisesUi
  const [values, setValues] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)

  const blankIds = Object.keys(ex.answers)
  const results = checked
    ? blankIds.map(id => answersMatch(ex.answers[id], values[id] ?? ''))
    : null
  const correct = results ? results.filter(Boolean).length : 0

  const verify = () => {
    setChecked(true)
    onComplete(correct / blankIds.length)
  }

  return (
    <div className="space-y-3">
      {ex.wordBank && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-verde-950/30 border border-verde-800/20">
          <span className="text-xs text-verde-600 mr-1 self-center">Palabras:</span>
          {ex.wordBank.map(w => (
            <span key={w} className="px-2 py-0.5 rounded-md bg-verde-900/40 border border-verde-700/30 text-xs text-verde-300 font-medium italic">{w}</span>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-verde-950/20 border border-verde-900/20 p-4 space-y-2.5">
        {ex.lines.map((line, lineIdx) => {
          const segments = parseDialogueLine(line.text)
          let blankCounter = 0
          const lineBlankIds = segments.filter(s => s.type === 'blank').map(s => s.content)

          return (
            <div key={lineIdx} className="flex items-baseline gap-2 flex-wrap leading-relaxed">
              <span className="text-xs font-bold text-verde-400 shrink-0">{line.speaker}:</span>
              <span className="text-sm text-verde-200 flex flex-wrap items-baseline gap-1">
                {segments.map((seg, segIdx) => {
                  if (seg.type === 'text') return <span key={segIdx}>{seg.content}</span>
                  const id = seg.content
                  const isOk = checked ? answersMatch(ex.answers[id], values[id] ?? '') : null
                  blankCounter++
                  return (
                    <input key={segIdx}
                      type="text"
                      value={values[id] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [id]: e.target.value }))}
                      disabled={checked}
                      className={[
                        'border-b-2 bg-transparent text-sm outline-none px-1 transition-colors',
                        'w-24 text-center italic',
                        checked
                          ? isOk ? 'border-green-500 text-green-300' : 'border-red-500 text-red-300'
                          : 'border-verde-600 text-verde-200 focus:border-verde-400',
                      ].join(' ')}
                    />
                  )
                  void blankCounter; void lineBlankIds
                })}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {!checked && (
          <button onClick={verify}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors">
            <CheckCircle2 size={14} /> {tEx.verify}
          </button>
        )}
        {ex.answerPanel && (
          <button onClick={() => setShowAnswers(s => !s)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-verde-800/40 text-verde-500 hover:text-verde-300 text-sm transition-colors">
            {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAnswers ? tEx.hideAnswers : tEx.showAnswers}
          </button>
        )}
      </div>

      {checked && <ResultBox correct={correct} total={blankIds.length} />}

      {showAnswers && ex.answerPanel && (
        <div className="rounded-xl bg-verde-950/30 border border-verde-800/30 p-3 space-y-1">
          <p className="text-xs font-bold text-verde-400 uppercase tracking-wide mb-2">{tEx.completeDialogue}</p>
          {ex.answerPanel.map((line, i) => (
            <p key={i} className="text-xs text-verde-400 flex items-center gap-1.5">
              <ChevronRight size={10} className="text-verde-600 shrink-0" />{line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Free Write Exercise ──────────────────────────────────────────────────────

function FreeWriteExercise({
  ex,
  onComplete,
}: {
  ex: ExerciseFreeWrite
  onComplete: (score: number) => void
}) {
  const { t } = useLanguage()
  const tEx = t.lessons.exercisesUi
  const [values, setValues] = useState<Record<string, string>>({})
  const [shown, setShown] = useState(false)

  const filled = ex.fields.filter(f => values[f.id]?.trim()).length

  const showResult = () => {
    setShown(true)
    onComplete(filled / ex.fields.length)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {ex.fields.map(field => (
          <div key={field.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-verde-950/20 border border-verde-900/20">
            <span className="text-sm text-verde-400 font-medium shrink-0">{field.prefix}</span>
            <input type="text" value={values[field.id] ?? ''} onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
              placeholder={field.placeholder}
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-verde-200 placeholder:text-verde-700" />
          </div>
        ))}
      </div>

      {!shown && (
        <button onClick={showResult}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors">
          <CheckCircle2 size={14} /> {tEx.viewResult}
        </button>
      )}

      {shown && filled > 0 && (
        <div className="rounded-xl bg-verde-950/30 border border-verde-800/30 p-4 space-y-1.5">
          <p className="text-xs font-bold text-verde-400 uppercase tracking-wide mb-2">{tEx.myPresentation}</p>
          {ex.fields.map(field => values[field.id]?.trim() && (
            <p key={field.id} className="text-sm text-verde-300">
              <span className="font-semibold text-verde-400">{field.prefix}</span> {values[field.id]}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({
  ex,
  onComplete,
}: {
  ex: Exercise
  onComplete: (score: number) => void
}) {
  return (
    <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-900/50 border border-blue-700/40 flex items-center justify-center shrink-0">
          <span className="text-sm font-black text-blue-300">{ex.number}</span>
        </div>
        <div>
          <h3 className="font-bold text-verde-100 text-base">{ex.title}</h3>
          {ex.instruction && (
            <p className="text-xs text-verde-500 mt-1 leading-relaxed border-l-2 border-blue-700/40 pl-2.5">
              {ex.instruction}
            </p>
          )}
        </div>
      </div>

      {ex.type === 'fill_blank' && <FillBlankExercise ex={ex} onComplete={onComplete} />}
      {ex.type === 'choice' && <ChoiceExercise ex={ex} onComplete={onComplete} />}
      {ex.type === 'dialogue' && <DialogueExercise ex={ex} onComplete={onComplete} />}
      {ex.type === 'free_write' && <FreeWriteExercise ex={ex} onComplete={onComplete} />}
    </div>
  )
}

// ─── Score Panel ──────────────────────────────────────────────────────────────

function ScorePanel({ scores, total }: { scores: Record<string, number>; total: number }) {
  const { t } = useLanguage()
  const tEx = t.lessons.exercisesUi
  const count = Object.keys(scores).length
  if (count === 0) return null
  const avg = Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / count) * 100)

  const label = avg >= 90 ? tEx.scoreExcellent :
    avg >= 70 ? tEx.scoreGood :
    avg >= 50 ? tEx.scoreOk :
    tEx.scorePractice

  return (
    <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6 text-center space-y-2">
      <p className="text-xs font-semibold text-verde-500 uppercase tracking-wide">{tEx.exercisesResult}</p>
      <p className="text-5xl font-black text-verde-400">{avg}%</p>
      <p className="text-sm text-verde-400">{label}</p>
      <p className="text-xs text-verde-600">{count} {tEx.resultOf} {total} {tEx.exercisesVerified}</p>
    </div>
  )
}

// ─── Lang flags ───────────────────────────────────────────────────────────────
const LANG_FLAGS: Record<string, string> = { es: '🇪🇸', it: '🇮🇹', en: '🇬🇧' }

// ─── Main Component ───────────────────────────────────────────────────────────

export function LessonExercises({
  exercises,
  exerciseTranslations,
}: {
  exercises: Exercise[]
  exerciseTranslations?: ExerciseTranslations
}) {
  const { t, lang } = useLanguage()
  const tEx = t.lessons.exercisesUi
  const [scores, setScores] = useState<Record<string, number>>({})
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const availableLangs = (['es', 'it', 'en'] as const).filter(
    l => (exerciseTranslations?.[l]?.length ?? 0) > 0
  )

  const [selectedLang, setSelectedLang] = useState<'es' | 'it' | 'en'>(() => {
    const userLang = lang as 'es' | 'it' | 'en'
    return availableLangs.includes(userLang) ? userLang : availableLangs[0] ?? 'es'
  })

  const activeExercises = availableLangs.length > 0
    ? (exerciseTranslations?.[selectedLang] ?? exercises)
    : exercises

  const handleComplete = useCallback((id: string, score: number) => {
    setScores(s => ({ ...s, [id]: score }))
    setCompletedIds(s => new Set([...s, id]))
  }, [])

  const handleLangChange = (l: 'es' | 'it' | 'en') => {
    setSelectedLang(l)
    setScores({})
    setCompletedIds(new Set())
  }

  if (!activeExercises || activeExercises.length === 0) return null

  return (
    <div className="space-y-4">
      {availableLangs.length > 1 && (
        <div className="flex items-center gap-2">
          {availableLangs.map(l => (
            <button
              key={l}
              onClick={() => handleLangChange(l)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                selectedLang === l
                  ? 'border-blue-500/70 bg-blue-950/40 text-blue-200'
                  : 'border-verde-900/30 bg-verde-950/10 text-verde-500 hover:text-verde-300 hover:border-verde-800/40',
              ].join(' ')}
            >
              <span>{LANG_FLAGS[l]}</span>
              <span className="uppercase">{l}</span>
            </button>
          ))}
        </div>
      )}

      <ProgressBar done={completedIds.size} total={activeExercises.length} />

      {activeExercises.map((ex, idx) => (
        <div key={ex.id}>
          {ex.section && (idx === 0 || activeExercises[idx - 1].section !== ex.section) && (
            <SectionDivider label={ex.section} />
          )}
          <ExerciseCard
            ex={ex}
            onComplete={(score) => handleComplete(ex.id, score)}
          />
        </div>
      ))}

      {completedIds.size > 0 && (
        <ScorePanel scores={scores} total={activeExercises.length} />
      )}
    </div>
  )
}
