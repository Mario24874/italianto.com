'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gamepad2, Lock, Play, X, HelpCircle, Puzzle, Wrench } from 'lucide-react'
import type { PlanType } from '@/lib/plans'
import { useLanguage } from '@/contexts/language-context'
import { QuizPlayer, type QuizContent } from '@/components/activities/quiz-player'

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  A2: 'bg-green-900/50 text-green-300 border-green-700/40',
  B1: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  B2: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
  C1: 'bg-red-900/50 text-red-300 border-red-700/40',
  C2: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
}

export interface ActivityRow {
  id: string
  title: string
  description: string
  type: string
  level: string
  plan_required: string
  content: Record<string, unknown>
  file_url: string | null
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'quiz') return <HelpCircle size={16} className="text-amber-400" />
  if (type === 'puzzle' || type === 'crossword') return <Puzzle size={16} className="text-amber-400" />
  return <Gamepad2 size={16} className="text-amber-400" />
}

function canPlay(act: ActivityRow): boolean {
  const hasQuiz = act.type === 'quiz' &&
    Array.isArray((act.content as QuizContent)?.questions) &&
    (act.content as QuizContent).questions.length > 0
  return hasQuiz || !!act.file_url
}

function ActivityModal({ activity, onClose }: { activity: ActivityRow; onClose: () => void }) {
  const { t } = useLanguage()
  const typeLabel = t.passatempi.types[activity.type as keyof typeof t.passatempi.types] ?? activity.type
  const quizContent = activity.type === 'quiz' ? (activity.content as QuizContent) : null
  const validQuiz = quizContent && Array.isArray(quizContent.questions) && quizContent.questions.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0a0f0a] border border-verde-800/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-verde-900/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/30 flex items-center justify-center shrink-0">
              <TypeIcon type={activity.type} />
            </div>
            <div>
              <h2 className="text-base font-bold text-verde-100 leading-tight">{activity.title}</h2>
              <p className="text-xs text-verde-500 mt-0.5">{typeLabel} · {activity.level}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-verde-600 hover:text-verde-200 transition-colors rounded-lg hover:bg-verde-900/30"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {validQuiz ? (
            <QuizPlayer content={quizContent} />
          ) : activity.file_url ? (
            <div className="w-full" style={{ height: '60vh' }}>
              <iframe
                src={activity.file_url}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
                title={activity.title}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-verde-700">
              <Wrench size={32} className="text-verde-800" />
              <p className="text-sm">{t.passatempi.comingSoon}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PassatempiClient({
  activities,
  userPlan,
  planHierarchy,
}: {
  activities: ActivityRow[]
  userPlan: PlanType
  planHierarchy: PlanType[]
}) {
  const { t } = useLanguage()
  const pt = t.passatempi
  const [selected, setSelected] = useState<ActivityRow | null>(null)

  function hasAccess(required: string) {
    return planHierarchy.indexOf(userPlan) >= planHierarchy.indexOf(required as PlanType)
  }

  return (
    <>
      {activities.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 size={48} className="text-verde-800 mx-auto mb-4" />
          <p className="text-verde-500">{pt.emptyState}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activities.map(act => {
            const accessible = hasAccess(act.plan_required)
            const playable = canPlay(act)
            const typeLabel = pt.types[act.type as keyof typeof pt.types] ?? act.type
            return accessible ? (
              <div
                key={act.id}
                className="p-5 rounded-2xl border border-verde-900/30 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50 transition-all"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-950/40 border border-amber-800/30 flex items-center justify-center shrink-0">
                    <TypeIcon type={act.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-verde-200 truncate">{act.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium text-amber-400 bg-amber-950/30 border border-amber-800/30 px-2 py-0.5 rounded">
                        {typeLabel}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${LEVEL_COLORS[act.level]}`}>
                        {act.level}
                      </span>
                    </div>
                  </div>
                  {playable && (
                    <button
                      onClick={() => setSelected(act)}
                      className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-900/30 border border-amber-800/40 text-amber-300 hover:bg-amber-900/50 transition-colors"
                    >
                      <Play size={11} />
                      {pt.playBtn}
                    </button>
                  )}
                </div>
                {act.description && (
                  <p className="text-xs text-verde-500 line-clamp-2">{act.description}</p>
                )}
              </div>
            ) : (
              <div key={act.id} className="p-5 rounded-2xl border border-verde-900/20 bg-verde-950/10 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-verde-900/20 flex items-center justify-center shrink-0">
                    <Lock size={16} className="text-verde-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-verde-500 truncate">{act.title}</div>
                    <Link href="/impostazioni" className="text-[10px] text-verde-600 hover:text-verde-400 transition-colors">
                      {pt.upgrade}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && <ActivityModal activity={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
