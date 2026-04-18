import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getServerLang } from '@/lib/lang-server'
import type { PlanType } from '@/lib/plans'
import type { LessonRow, LessonProgressRow, LessonLevel } from '@/types'
import Link from 'next/link'
import { Lock, CheckCircle2, XCircle, BookOpen, ChevronRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Lezioni — Italianto' }

const PLAN_HIERARCHY: PlanType[] = ['free', 'essenziale', 'avanzato', 'maestro']

const LEVEL_COLORS: Record<LessonLevel, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  A2: 'bg-green-900/50 text-green-300 border-green-700/40',
  B1: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  B2: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
  C1: 'bg-red-900/50 text-red-300 border-red-700/40',
  C2: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
}

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Gratis',
  essenziale: 'Essenziale',
  avanzato: 'Avanzato',
  maestro: 'Maestro',
}

function hasAccess(userPlan: PlanType, required: PlanType): boolean {
  return PLAN_HIERARCHY.indexOf(userPlan) >= PLAN_HIERARCHY.indexOf(required)
}

export default async function LezioniPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')
  const { t } = await getServerLang()

  const supabase = getSupabaseAdmin()
  const [lessonsResult, subResult, progressResult] = await Promise.all([
    supabase
      .from('lessons')
      .select('id,slug,title,level,order_index,plan_required,status,vocabulary')
      .eq('status', 'published')
      .order('order_index', { ascending: true }),
    supabase
      .from('subscriptions')
      .select('plan_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('lesson_progress')
      .select('lesson_id,score,status')
      .eq('user_id', user.id),
  ])

  const lessons = (lessonsResult.data ?? []) as Pick<
    LessonRow,
    'id' | 'slug' | 'title' | 'level' | 'order_index' | 'plan_required' | 'status' | 'vocabulary'
  >[]
  const userPlan = (subResult.data?.plan_type ?? 'free') as PlanType
  const progressMap = Object.fromEntries(
    (progressResult.data ?? []).map((p: Pick<LessonProgressRow, 'lesson_id' | 'score' | 'status'>) => [
      p.lesson_id,
      p,
    ])
  )

  // Sequential unlock: each lesson requires the previous one within the SAME level to be 'passed'
  const sequentialUnlocked: Record<string, boolean> = {}
  const levelOrder2: LessonLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  for (const level of levelOrder2) {
    const levelLessons = lessons.filter(l => l.level === level)
    let prevPassed = true
    for (const lesson of levelLessons) {
      sequentialUnlocked[lesson.id] = prevPassed
      prevPassed = progressMap[lesson.id]?.status === 'passed'
    }
  }

  // Group by level
  const byLevel: Record<string, typeof lessons> = {}
  for (const lesson of lessons) {
    if (!byLevel[lesson.level]) byLevel[lesson.level] = []
    byLevel[lesson.level].push(lesson)
  }
  const levelOrder: LessonLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-verde-900 dark:text-verde-50 flex items-center gap-3">
          <BookOpen size={28} className="text-verde-600 dark:text-verde-400" />
          {t.lessons.title}
        </h1>
        <p className="text-verde-600 dark:text-verde-500 mt-1 text-sm">
          {t.lessons.subtitle} {PLAN_LABELS[userPlan]}
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={48} className="text-verde-800 mx-auto mb-4" />
          <p className="text-verde-500">{t.lessons.comingSoon}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {levelOrder.map(level => {
            const levelLessons = byLevel[level]
            if (!levelLessons?.length) return null
            return (
              <div key={level}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${LEVEL_COLORS[level]}`}>
                    {level}
                  </span>
                  <div className="flex-1 h-px bg-verde-900/40" />
                  <span className="text-xs text-verde-600">{levelLessons.length} {t.lessons.lessonsCount}</span>
                </div>

                <div className="space-y-2">
                  {levelLessons.map(lesson => {
                    const planOk = hasAccess(userPlan, lesson.plan_required as PlanType)
                    const unlocked = sequentialUnlocked[lesson.id]
                    const accessible = planOk && unlocked
                    const progress = progressMap[lesson.id]
                    const vocabCount = Array.isArray(lesson.vocabulary) ? lesson.vocabulary.length : 0

                    return accessible ? (
                      <Link
                        key={lesson.id}
                        href={`/lezioni/${lesson.slug}`}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-verde-900/30 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-verde-900/40 flex items-center justify-center shrink-0">
                          {progress?.status === 'passed' ? (
                            <CheckCircle2 size={20} className="text-verde-400" />
                          ) : progress?.status === 'failed' ? (
                            <XCircle size={20} className="text-red-400" />
                          ) : (
                            <BookOpen size={18} className="text-verde-600 group-hover:text-verde-400 transition-colors" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-verde-800 dark:text-verde-200 group-hover:text-verde-900 dark:group-hover:text-verde-100 transition-colors truncate">
                            {lesson.title}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {vocabCount > 0 && (
                              <span className="text-xs text-verde-600">{vocabCount} {t.lessons.words}</span>
                            )}
                            {progress && (
                              <span className={`text-xs font-medium ${progress.status === 'passed' ? 'text-verde-600 dark:text-verde-400' : 'text-red-600 dark:text-red-400'}`}>
                                {t.lessons.score}: {progress.score}/10
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-verde-700 group-hover:text-verde-400 transition-colors shrink-0" />
                      </Link>
                    ) : (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-verde-900/20 bg-verde-950/10 opacity-60 cursor-not-allowed"
                      >
                        <div className="w-10 h-10 rounded-xl bg-verde-900/20 flex items-center justify-center shrink-0">
                          <Lock size={16} className="text-verde-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-verde-600 dark:text-verde-500 truncate">{lesson.title}</div>
                          <div className="text-xs text-verde-600 dark:text-verde-700 mt-0.5">
                            {!planOk
                              ? `${t.lessons.requiredPlan} ${PLAN_LABELS[lesson.plan_required as PlanType]}`
                              : t.lessons.completePrevious}
                          </div>
                        </div>
                        {!planOk && (
                          <Link
                            href="/impostazioni"
                            onClick={e => e.stopPropagation()}
                            className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-verde-800/40 text-verde-500 hover:text-verde-300 hover:border-verde-600 transition-colors"
                          >
                            {t.lessons.upgrade}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
