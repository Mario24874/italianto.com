'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'

export type WordMatchPair = { italian: string; translation: string }
export type WordMatchContent = { pairs: WordMatchPair[]; timeLimit?: number }

type CardSide = 'italian' | 'translation'
interface Card { id: string; text: string; pairIndex: number; side: CardSide }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildCards(pairs: WordMatchPair[]): [Card[], Card[]] {
  const left = shuffle(pairs.map((p, i) => ({ id: `it-${i}`, text: p.italian, pairIndex: i, side: 'italian' as CardSide })))
  const right = shuffle(pairs.map((p, i) => ({ id: `tr-${i}`, text: p.translation, pairIndex: i, side: 'translation' as CardSide })))
  return [left, right]
}

export function WordMatchPlayer({ content }: { content: WordMatchContent }) {
  const { t } = useLanguage()
  const wt = t.wordmatch

  const pairs = content.pairs ?? []
  const timeLimit = content.timeLimit ?? 0

  const [left, setLeft] = useState<Card[]>([])
  const [right, setRight] = useState<Card[]>([])
  const [selected, setSelected] = useState<Card | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [done, setDone] = useState(false)
  const [timeUpFlag, setTimeUpFlag] = useState(false)

  const init = useCallback(() => {
    const [l, r] = buildCards(pairs)
    setLeft(l)
    setRight(r)
    setSelected(null)
    setMatched(new Set())
    setWrong(new Set())
    setTimeLeft(timeLimit)
    setDone(false)
    setTimeUpFlag(false)
  }, [pairs, timeLimit])

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (!timeLimit || done || timeUpFlag) return
    if (timeLeft <= 0) { setTimeUpFlag(true); setDone(true); return }
    const id = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, timeLimit, done, timeUpFlag])

  function handleSelect(card: Card) {
    if (matched.has(card.pairIndex)) return
    if (wrong.has(card.id)) return

    if (!selected) {
      setSelected(card)
      return
    }

    if (selected.id === card.id) {
      setSelected(null)
      return
    }

    if (selected.side === card.side) {
      setSelected(card)
      return
    }

    if (selected.pairIndex === card.pairIndex) {
      const nextMatched = new Set(matched).add(card.pairIndex)
      setMatched(nextMatched)
      setSelected(null)
      if (nextMatched.size === pairs.length) setDone(true)
    } else {
      const wrongSet = new Set([selected.id, card.id])
      setWrong(wrongSet)
      setSelected(null)
      setTimeout(() => setWrong(new Set()), 600)
    }
  }

  if (!pairs.length) {
    return (
      <div className="flex items-center justify-center py-16 text-verde-600 text-sm px-5">
        {wt.noContent}
      </div>
    )
  }

  const matchedCount = matched.size

  if (done) {
    const allMatched = matchedCount === pairs.length
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 px-5">
        <div className="text-5xl">{allMatched ? '🎉' : '⏰'}</div>
        <p className="text-xl font-bold text-verde-100">
          {allMatched ? wt.allMatched : wt.timeUp}
        </p>
        <p className="text-sm text-verde-400">
          {matchedCount} {wt.outOf} {pairs.length} {wt.pairsMatched}
        </p>
        <button
          onClick={init}
          className="mt-2 px-5 py-2 rounded-xl bg-amber-900/40 border border-amber-800/50 text-amber-300 text-sm font-semibold hover:bg-amber-900/60 transition-colors"
        >
          {wt.retry}
        </button>
      </div>
    )
  }

  return (
    <div className="px-5 py-5 space-y-4">
      {/* Timer + progress */}
      <div className="flex items-center justify-between text-xs text-verde-600">
        <span>{matchedCount} {wt.outOf} {pairs.length} {wt.pairsMatched}</span>
        {timeLimit > 0 && (
          <span className={cn('font-mono', timeLeft <= 10 && 'text-red-400 font-bold')}>
            {wt.time}: {timeLeft}s
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-verde-900/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500/60 rounded-full transition-all duration-300"
          style={{ width: `${(matchedCount / pairs.length) * 100}%` }}
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {left.map(card => (
            <CardButton
              key={card.id}
              card={card}
              selected={selected?.id === card.id}
              matched={matched.has(card.pairIndex)}
              wrong={wrong.has(card.id)}
              onClick={() => handleSelect(card)}
            />
          ))}
        </div>
        <div className="space-y-2">
          {right.map(card => (
            <CardButton
              key={card.id}
              card={card}
              selected={selected?.id === card.id}
              matched={matched.has(card.pairIndex)}
              wrong={wrong.has(card.id)}
              onClick={() => handleSelect(card)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CardButton({ card, selected, matched, wrong, onClick }: {
  card: Card
  selected: boolean
  matched: boolean
  wrong: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={matched}
      className={cn(
        'w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all duration-150',
        matched && 'bg-verde-900/30 border-verde-700/30 text-verde-400 opacity-50 cursor-default',
        wrong && 'bg-red-900/40 border-red-700/50 text-red-300 animate-pulse',
        selected && !matched && !wrong && 'bg-amber-900/50 border-amber-600/60 text-amber-200 shadow-md',
        !matched && !wrong && !selected && 'bg-verde-950/40 border-verde-800/30 text-verde-200 hover:bg-verde-900/30 hover:border-verde-700/50'
      )}
    >
      {card.text}
    </button>
  )
}
