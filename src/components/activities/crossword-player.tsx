'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'

const BUBBLE_MESSAGES = [
  "Dai, puoi farcela! 💪",
  "Ti sta prendendo un po' di tempo? Respira! 😊",
  "Consulta il traduttore se hai dubbi! 📖",
  "Ottimo lavoro fin qui! Continua così! ⭐",
  "Quasi ci siamo! Non mollare! 🎯",
  "Ogni parola è un passo avanti nell'italiano! 🇮🇹",
  "Stai andando benissimo, bravo/a! 🚀",
  "Prenditi il tuo tempo, nessuna fretta! ⏳",
  "Hai già indovinato molte parole! 🌟",
  "Pensa in italiano e la risposta arriverà! 💡",
  "Sei un campione dell'italiano! 🏆",
  "Una parola alla volta, ce la fai! ✨",
  "Non arrenderti, sei sulla strada giusta! 🌈",
]

export type CrosswordWord = {
  word: string
  clue: string
  direction: 'across' | 'down'
  row: number
  col: number
}
export type CrosswordContent = {
  size: { rows: number; cols: number }
  words: CrosswordWord[]
}

type CellState = {
  letter: string
  isBlack: boolean
  wordIndices: number[]
  number?: number
}

function buildGrid(content: CrosswordContent): CellState[][] {
  const { rows, cols } = content.size
  const grid: CellState[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ letter: '', isBlack: true, wordIndices: [] }))
  )

  content.words.forEach((w, wi) => {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.direction === 'across' ? w.row : w.row + i
      const c = w.direction === 'across' ? w.col + i : w.col
      if (r < rows && c < cols) {
        grid[r][c].isBlack = false
        grid[r][c].wordIndices.push(wi)
      }
    }
  })

  // Number cells
  let num = 1
  content.words.forEach(w => {
    const cell = grid[w.row]?.[w.col]
    if (cell && !cell.isBlack && !cell.number) {
      cell.number = num++
    }
  })

  return grid
}

export function CrosswordPlayer({ content }: { content: CrosswordContent }) {
  const { t } = useLanguage()
  const ct = t.crossword

  const words = content.words ?? []
  const size = content.size ?? { rows: 1, cols: 1 }

  const [grid, setGrid] = useState<CellState[][]>([])
  const [input, setInput] = useState<string[][]>([])
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null)
  const [direction, setDirection] = useState<'across' | 'down'>('across')
  const [checked, setChecked] = useState(false)
  const [complete, setComplete] = useState(false)
  const [bubbleMsg, setBubbleMsg] = useState<string | null>(null)
  const [mascotBounce, setMascotBounce] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([])

  const init = useCallback(() => {
    const g = buildGrid(content)
    setGrid(g)
    setInput(g.map(row => row.map(() => '')))
    setSelected(null)
    setDirection('across')
    setChecked(false)
    setComplete(false)
    inputRefs.current = g.map(row => row.map(() => null))
  }, [content])

  useEffect(() => { init() }, [init])

  // Mascot speech bubble — random motivational messages in Italian
  useEffect(() => {
    if (!words.length || complete) return
    const shuffled = [...BUBBLE_MESSAGES].sort(() => Math.random() - 0.5)
    let idx = 0
    let hideId: ReturnType<typeof setTimeout> | null = null
    let wiggleId: ReturnType<typeof setTimeout> | null = null
    let intervalId: ReturnType<typeof setInterval> | null = null

    function showMessage() {
      const msg = shuffled[idx % shuffled.length]
      idx++
      setBubbleMsg(msg)
      setMascotBounce(true)
      if (wiggleId) clearTimeout(wiggleId)
      if (hideId) clearTimeout(hideId)
      wiggleId = setTimeout(() => setMascotBounce(false), 900)
      hideId = setTimeout(() => setBubbleMsg(null), 6000)
    }

    // First message after 5s, then repeat every 60–90s
    const firstId = setTimeout(() => {
      showMessage()
      intervalId = setInterval(showMessage, 60000 + Math.random() * 30000)
    }, 5000)

    return () => {
      clearTimeout(firstId)
      if (intervalId) clearInterval(intervalId)
      if (hideId) clearTimeout(hideId)
      if (wiggleId) clearTimeout(wiggleId)
      setBubbleMsg(null)
      setMascotBounce(false)
    }
  }, [words.length, complete])

  if (!words.length) {
    return (
      <div className="flex items-center justify-center py-16 text-verde-600 text-sm px-5">
        {ct.noContent}
      </div>
    )
  }

  function handleCellClick(row: number, col: number) {
    if (grid[row]?.[col]?.isBlack) return
    if (selected?.row === row && selected?.col === col) {
      setDirection(d => d === 'across' ? 'down' : 'across')
    } else {
      setSelected({ row, col })
    }
    inputRefs.current[row]?.[col]?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent, row: number, col: number) {
    if (e.key === 'Backspace') {
      if (input[row]?.[col]) {
        const next = input.map(r => [...r])
        next[row][col] = ''
        setInput(next)
      } else {
        movePrev(row, col)
      }
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowRight') { setDirection('across'); moveNext(row, col, 'across'); e.preventDefault(); return }
    if (e.key === 'ArrowLeft') { setDirection('across'); movePrev(row, col); e.preventDefault(); return }
    if (e.key === 'ArrowDown') { setDirection('down'); moveNext(row, col, 'down'); e.preventDefault(); return }
    if (e.key === 'ArrowUp') { setDirection('down'); movePrev(row, col); e.preventDefault(); return }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) {
    const val = e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÀÈÌÒÙÑÜ]/i, '').slice(-1)
    const next = input.map(r => [...r])
    next[row][col] = val
    setInput(next)
    setChecked(false)
    if (val) moveNext(row, col, direction)
  }

  function moveNext(row: number, col: number, dir: 'across' | 'down') {
    const nr = dir === 'down' ? row + 1 : row
    const nc = dir === 'across' ? col + 1 : col
    if (nr < size.rows && nc < size.cols && !grid[nr]?.[nc]?.isBlack) {
      setSelected({ row: nr, col: nc })
      inputRefs.current[nr]?.[nc]?.focus()
    }
  }

  function movePrev(row: number, col: number) {
    const nr = direction === 'down' ? row - 1 : row
    const nc = direction === 'across' ? col - 1 : col
    if (nr >= 0 && nc >= 0 && !grid[nr]?.[nc]?.isBlack) {
      setSelected({ row: nr, col: nc })
      inputRefs.current[nr]?.[nc]?.focus()
    }
  }

  function handleCheck() {
    setChecked(true)
    const allCorrect = words.every(w => {
      for (let i = 0; i < w.word.length; i++) {
        const r = w.direction === 'across' ? w.row : w.row + i
        const c = w.direction === 'across' ? w.col + i : w.col
        if ((input[r]?.[c] ?? '') !== w.word[i].toUpperCase()) return false
      }
      return true
    })
    if (allCorrect) setComplete(true)
  }

  function handleReset() {
    setInput(grid.map(row => row.map(() => '')))
    setChecked(false)
    setComplete(false)
  }

  function isCellCorrect(row: number, col: number): boolean {
    if (!checked) return true
    const cell = grid[row]?.[col]
    if (!cell || cell.isBlack) return true
    const expected = words
      .filter(w => cell.wordIndices.includes(words.indexOf(w)))
      .map(w => {
        const idx = w.direction === 'across' ? col - w.col : row - w.row
        return w.word[idx]?.toUpperCase() ?? ''
      })
    return expected.some(e => e === (input[row]?.[col] ?? ''))
  }

  function isCellInActiveWord(row: number, col: number): boolean {
    if (!selected) return false
    return words.some(w => {
      const r0 = w.row, c0 = w.col
      if (direction === 'across' && w.direction === 'across' && row === r0 && col >= c0 && col < c0 + w.word.length) {
        return selected.row === r0 && selected.col >= c0 && selected.col < c0 + w.word.length
      }
      if (direction === 'down' && w.direction === 'down' && col === c0 && row >= r0 && row < r0 + w.word.length) {
        return selected.col === c0 && selected.row >= r0 && selected.row < r0 + w.word.length
      }
      return false
    })
  }

  const correctCount = words.filter(w => {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.direction === 'across' ? w.row : w.row + i
      const c = w.direction === 'across' ? w.col + i : w.col
      if ((input[r]?.[c] ?? '') !== w.word[i].toUpperCase()) return false
    }
    return true
  }).length

  const acrossWords = words.filter(w => w.direction === 'across')
  const downWords = words.filter(w => w.direction === 'down')

  // Clue numbers (recompute from grid)
  const clueNumbers: Record<string, number> = {}
  let num = 1
  words.forEach((w, wi) => {
    const cell = grid[w.row]?.[w.col]
    if (cell && !cell.isBlack) {
      if (!(w.row + ',' + w.col in clueNumbers)) {
        clueNumbers[`${w.row},${w.col}`] = num++
      }
      clueNumbers[`w${wi}`] = clueNumbers[`${w.row},${w.col}`]
    }
  })

  const cellSize = Math.min(36, Math.floor(280 / Math.max(size.cols, size.rows)))

  return (
    <div className="px-4 py-4 space-y-4">
      {complete && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-verde-900/40 border border-verde-700/40">
          <span className="text-lg">🎉</span>
          <span className="text-sm font-semibold text-verde-200">{ct.complete}</span>
        </div>
      )}

      {/* Grid + mascot row */}
      <div className="flex items-end gap-3">
        {/* Left: grid + buttons */}
        <div className="space-y-3 shrink-0">
          <div className="overflow-x-auto">
            <div
              className="inline-grid gap-px bg-verde-800/20 border border-verde-800/30 rounded-lg overflow-hidden"
              style={{ gridTemplateColumns: `repeat(${size.cols}, ${cellSize}px)` }}
            >
              {grid.map((row, ri) =>
                row.map((cell, ci) => {
                  const isSelected = selected?.row === ri && selected?.col === ci
                  const isHighlighted = isCellInActiveWord(ri, ci)
                  const isCorrectCell = isCellCorrect(ri, ci)

                  return (
                    <div
                      key={`${ri}-${ci}`}
                      style={{ width: cellSize, height: cellSize }}
                      className={cn(
                        'relative flex items-center justify-center',
                        cell.isBlack ? 'bg-verde-900/60' : 'cursor-pointer',
                        !cell.isBlack && isSelected && 'bg-amber-800/60',
                        !cell.isBlack && isHighlighted && !isSelected && 'bg-amber-900/30',
                        !cell.isBlack && !isHighlighted && !isSelected && 'bg-[#0d150d]',
                        !cell.isBlack && checked && !isCorrectCell && 'bg-red-900/40',
                      )}
                      onClick={() => handleCellClick(ri, ci)}
                    >
                      {!cell.isBlack && (
                        <>
                          {cell.number && (
                            <span className="absolute top-0.5 left-0.5 text-[7px] leading-none text-verde-500 font-bold z-10">
                              {cell.number}
                            </span>
                          )}
                          <input
                            ref={el => { if (!inputRefs.current[ri]) inputRefs.current[ri] = []; inputRefs.current[ri][ci] = el }}
                            value={input[ri]?.[ci] ?? ''}
                            onChange={e => handleInput(e, ri, ci)}
                            onKeyDown={e => handleKeyDown(e, ri, ci)}
                            onFocus={() => setSelected({ row: ri, col: ci })}
                            maxLength={1}
                            className="w-full h-full text-center bg-transparent text-sm font-bold text-verde-100 outline-none caret-transparent uppercase"
                            style={{ fontSize: Math.max(10, cellSize * 0.4) }}
                          />
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCheck}
              className="flex-1 py-2 rounded-xl bg-amber-900/40 border border-amber-800/50 text-amber-300 text-sm font-semibold hover:bg-amber-900/60 transition-colors"
            >
              {ct.check}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-2 rounded-xl bg-verde-900/30 border border-verde-800/40 text-verde-400 text-sm font-semibold hover:bg-verde-900/50 transition-colors"
            >
              {ct.reset}
            </button>
          </div>

          {checked && !complete && (
            <p className="text-xs text-verde-500 text-center">
              {correctCount} {ct.outOf} {words.length} {ct.correct}
            </p>
          )}
        </div>

        {/* Right: animated mascot + speech bubble */}
        <div className="hidden sm:flex flex-1 justify-center items-end min-w-0 pb-1">
          {/* Keyframes defined inline so they're guaranteed available */}
          <style>{`
            @keyframes itl-float {
              0%,100% { transform: translateY(0px); }
              50%      { transform: translateY(-10px); }
            }
            @keyframes itl-speak {
              0%,100% { transform: translateY(0) rotate(0deg); }
              20%     { transform: translateY(-7px) rotate(-6deg); }
              40%     { transform: translateY(-7px) rotate(6deg); }
              60%     { transform: translateY(-4px) rotate(-3deg); }
              80%     { transform: translateY(-4px) rotate(3deg); }
            }
            @keyframes itl-bubble {
              from { opacity:0; transform: translateY(8px) scale(0.92); }
              to   { opacity:1; transform: translateY(0) scale(1); }
            }
          `}</style>

          <div className="relative flex flex-col items-center">
            {/* Speech bubble — new key per message so animation always replays */}
            {bubbleMsg && (
              <div
                key={bubbleMsg}
                className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-max max-w-[170px] z-10"
                style={{ animation: 'itl-bubble 0.3s ease-out forwards' }}
              >
                <div className="bg-[#132213] border border-verde-700/50 rounded-2xl px-3 py-2 shadow-xl">
                  <p className="text-xs text-verde-100 leading-snug text-center whitespace-normal">
                    {bubbleMsg}
                  </p>
                </div>
                <div className="flex justify-center -mt-px">
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[7px] border-l-transparent border-r-transparent border-t-verde-700/50" />
                </div>
              </div>
            )}
            {/* Wrapper div drives the animation — keeps Next.js Image clean */}
            <div
              style={{
                maxHeight: `${size.rows * cellSize + 40}px`,
                animation: mascotBounce
                  ? 'itl-speak 0.9s ease-in-out forwards'
                  : 'itl-float 5s ease-in-out infinite',
              }}
            >
              <Image
                src="/mascot-nobg.png"
                alt="Italianto mascota"
                width={180}
                height={180}
                className="object-contain drop-shadow-lg select-none pointer-events-none"
                style={{ maxHeight: `${size.rows * cellSize + 40}px` }}
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Clues */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {acrossWords.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-verde-500 uppercase tracking-widest mb-2">{ct.across}</h4>
            <ol className="space-y-1">
              {acrossWords.map((w, i) => (
                <li key={i} className="text-xs text-verde-400 flex gap-1.5">
                  <span className="font-bold text-verde-500 shrink-0 w-5 text-right">{clueNumbers[`w${words.indexOf(w)}`]}.</span>
                  <span>{w.clue}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {downWords.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-verde-500 uppercase tracking-widest mb-2">{ct.down}</h4>
            <ol className="space-y-1">
              {downWords.map((w, i) => (
                <li key={i} className="text-xs text-verde-400 flex gap-1.5">
                  <span className="font-bold text-verde-500 shrink-0 w-5 text-right">{clueNumbers[`w${words.indexOf(w)}`]}.</span>
                  <span>{w.clue}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
