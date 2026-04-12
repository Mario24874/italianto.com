import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType } from '@/lib/plans'
import type { LessonRow, LessonProgressRow, LessonLevel } from '@/types'
import Link from 'next/link'
import { ChevronLeft, Lock, AlignLeft, GraduationCap, CalendarClock } from 'lucide-react'
import { LessonExam } from './_lesson-exam'
import { LessonExercises } from './_lesson-exercises'
import { LessonContentSwitcher } from './_lesson-content-switcher'

const WEEKLY_LIMITS: Record<PlanType, number> = {
  free: 0,
  essenziale: 1,
  avanzato: 2,
  maestro: 3,
}

/** Monday of the current ISO week as YYYY-MM-DD */
function currentWeekStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = Sunday
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().split('T')[0]
}

const LEVEL_COLORS: Record<LessonLevel, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  A2: 'bg-green-900/50 text-green-300 border-green-700/40',
  B1: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  B2: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
  C1: 'bg-red-900/50 text-red-300 border-red-700/40',
  C2: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('lessons').select('title, level').eq('slug', slug).eq('status', 'published').single()
  return { title: data ? `${data.title} (${data.level}) — Italianto` : 'Lezione — Italianto' }
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = getSupabaseAdmin()
  const [lessonResult, subResult] = await Promise.all([
    supabase.from('lessons').select('*').eq('slug', slug).eq('status', 'published').single(),
    supabase.from('subscriptions').select('plan_type').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
  ])

  if (!lessonResult.data) notFound()
  const lesson = lessonResult.data as LessonRow
  const userPlan = (subResult.data?.plan_type ?? 'free') as PlanType
  const weekLimit = WEEKLY_LIMITS[userPlan]
  const weekStart = currentWeekStart()

  // Check weekly access quota
  const { data: weekAccesses } = await supabase
    .from('lesson_weekly_access')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)

  const alreadyAccessed = weekAccesses?.some(a => a.lesson_id === lesson.id) ?? false
  const weekAccessCount = weekAccesses?.length ?? 0

  let accessible = false
  let quotaExhausted = false
  if (alreadyAccessed) {
    accessible = true
  } else if (weekLimit === 0) {
    accessible = false
  } else if (weekAccessCount < weekLimit) {
    await supabase.from('lesson_weekly_access').insert({
      user_id: user.id,
      lesson_id: lesson.id,
      week_start: weekStart,
    })
    accessible = true
  } else {
    accessible = false
    quotaExhausted = true
  }

  const [{ data: progress }] = await Promise.all([
    supabase.from('lesson_progress').select('score,status,attempts')
      .eq('user_id', user.id).eq('lesson_id', lesson.id).maybeSingle(),
  ])

  // Build subtitle tracks array
  const subtitleTracks: { src: string; srclang: string; label: string }[] = []
  if (lesson.video_subtitles) {
    if (lesson.video_subtitles.es) subtitleTracks.push({ src: lesson.video_subtitles.es, srclang: 'es', label: 'Español' })
    if (lesson.video_subtitles.en) subtitleTracks.push({ src: lesson.video_subtitles.en, srclang: 'en', label: 'English' })
    if (lesson.video_subtitles.it) subtitleTracks.push({ src: lesson.video_subtitles.it, srclang: 'it', label: 'Italiano' })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Back + level badge */}
      <div className="flex items-center gap-3">
        <Link href="/lezioni" className="flex items-center gap-1.5 text-sm text-verde-500 hover:text-verde-300 transition-colors">
          <ChevronLeft size={16} />Lezioni
        </Link>
        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${LEVEL_COLORS[lesson.level]}`}>
          {lesson.level}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-verde-50">{lesson.title}</h1>
      </div>

      {!accessible ? (
        /* ── Paywall ── */
        <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-verde-900/30 flex items-center justify-center mx-auto">
            {quotaExhausted
              ? <CalendarClock size={28} className="text-amber-500" />
              : <Lock size={28} className="text-verde-700" />}
          </div>
          <div>
            {quotaExhausted ? (
              <>
                <h2 className="text-xl font-bold text-verde-200">Límite semanal alcanzado</h2>
                <p className="text-verde-500 text-sm mt-2 max-w-sm mx-auto">
                  Tu plan <strong className="text-verde-300 capitalize">{userPlan}</strong> incluye{' '}
                  <strong className="text-verde-300">{weekLimit} {weekLimit === 1 ? 'lección' : 'lecciones'} por semana</strong>.
                  {' '}Vuelve el próximo lunes para continuar.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-verde-200">Suscríbete para continuar</h2>
                <p className="text-verde-500 text-sm mt-2 max-w-xs mx-auto">
                  Accede a todas las lecciones con un plan de suscripción.
                </p>
              </>
            )}
          </div>
          <Link href="/impostazioni"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-verde-700 hover:bg-verde-600 text-white font-semibold rounded-xl transition-colors text-sm">
            {quotaExhausted ? 'Ver planes superiores' : 'Ver planes'}
          </Link>
        </div>
      ) : (
        <>
          {/* ── Intro Video ── */}
          {lesson.intro_video_url && (
            <div className="rounded-2xl overflow-hidden border border-verde-900/30 bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={lesson.intro_video_url}
                autoPlay
                muted
                playsInline
                controls
                className="w-full max-h-[480px] object-contain"
              >
                {subtitleTracks.map(track => (
                  <track
                    key={track.srclang}
                    kind="subtitles"
                    src={track.src}
                    srcLang={track.srclang}
                    label={track.label}
                    default={track.srclang === (lesson.ui_language ?? 'es')}
                  />
                ))}
              </video>
            </div>
          )}

          {/* ── Lesson Content + Vocabulary + Grammar (with language switcher) ── */}
          {(lesson.content_html || (Array.isArray(lesson.vocabulary) && lesson.vocabulary.length > 0) || lesson.grammar_notes) && (
            <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6">
              <div className="flex items-center gap-2 mb-5">
                <AlignLeft size={16} className="text-verde-500" />
                <h2 className="font-semibold text-verde-300 text-sm uppercase tracking-wide">Lezione</h2>
              </div>
              <LessonContentSwitcher
                defaultContent={lesson.content_html}
                defaultGrammarNotes={lesson.grammar_notes}
                defaultVocabulary={lesson.vocabulary ?? []}
                translations={lesson.translations ?? {}}
              />
            </div>
          )}

          {/* ── Interactive Exercises ── */}
          {Array.isArray(lesson.exercises) && lesson.exercises.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap size={16} className="text-blue-400" />
                <h2 className="font-semibold text-blue-300 text-sm uppercase tracking-wide">
                  Esercizi interattivi ({lesson.exercises.length})
                </h2>
              </div>
              <LessonExercises exercises={lesson.exercises} />
            </div>
          )}

          {/* ── Exam ── */}
          <LessonExam
            slug={slug}
            initialProgress={progress as Pick<LessonProgressRow, 'score' | 'status' | 'attempts'> | null}
          />
        </>
      )}
    </div>
  )
}
