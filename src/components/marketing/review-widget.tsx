'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/language-context'

const API_URL = 'https://app.mariomoreno.work/api/analytics/review'

type Step = 'idle' | 'open' | 'submitting' | 'done' | 'error'

export function ReviewWidget() {
  const { t } = useLanguage()
  const rw = t.reviewWidget
  const [step, setStep] = useState<Step>('idle')
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return
    setStep('submitting')
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment || undefined,
          reviewer_name: name || undefined,
          source: 'italianto',
        }),
      })
      setStep(res.ok ? 'done' : 'error')
    } catch {
      setStep('error')
    }
  }

  function reset() {
    setStep('idle')
    setRating(0)
    setHovered(0)
    setName('')
    setComment('')
  }

  const activeRating = hovered || rating

  return (
    <>
      {step === 'idle' && (
        <button
          onClick={() => setStep('open')}
          title={rw.buttonTitle}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-verde-900 border border-verde-700/50 text-verde-100 text-sm font-semibold shadow-lg hover:scale-105 transition-transform cursor-pointer"
        >
          <span className="text-base">⭐</span>
          {rw.buttonLabel}
        </button>
      )}

      {step !== 'idle' && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) reset() }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-bg-dark border border-verde-900/40 p-7 shadow-2xl">
            {step === 'done' ? (
              <div className="text-center py-3">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-verde-100 text-lg font-bold mb-2">{rw.doneTitle}</h3>
                <p className="text-verde-500 text-sm mb-5">{rw.doneDescription}</p>
                <button onClick={reset} className="px-5 py-2 rounded-lg bg-verde-900/60 text-verde-400 text-sm cursor-pointer hover:bg-verde-900 transition-colors">
                  {rw.close}
                </button>
              </div>
            ) : step === 'error' ? (
              <div className="text-center py-3">
                <div className="text-4xl mb-3">😕</div>
                <h3 className="text-verde-100 text-lg font-bold mb-2">{rw.errorTitle}</h3>
                <p className="text-verde-500 text-sm mb-5">{rw.errorDescription}</p>
                <button onClick={reset} className="px-5 py-2 rounded-lg bg-verde-900/60 text-verde-400 text-sm cursor-pointer hover:bg-verde-900 transition-colors">
                  {rw.close}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-verde-100 text-base font-bold">{rw.modalTitle}</h3>
                  <button type="button" onClick={reset} className="text-verde-600 hover:text-verde-400 text-lg leading-none cursor-pointer transition-colors">✕</button>
                </div>

                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHovered(s)}
                      onMouseLeave={() => setHovered(0)}
                      className="text-4xl bg-transparent border-none cursor-pointer transition-transform"
                      style={{
                        color: s <= activeRating ? '#f59e0b' : '#1e3a2f',
                        transform: s <= activeRating ? 'scale(1.15)' : 'scale(1)',
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <p className="text-center text-verde-400 text-sm">{rw.ratingLabels[rating]}</p>
                )}

                <input
                  type="text"
                  placeholder={rw.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
                />
                <textarea
                  placeholder={rw.commentPlaceholder}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 resize-none transition-colors"
                />

                <button
                  type="submit"
                  disabled={rating === 0 || step === 'submitting'}
                  className="w-full py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {step === 'submitting' ? rw.submitting : rw.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
