import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType } from '@/lib/plans'
import type { LessonRow, LessonProgressRow, LessonLevel } from '@/types'
import Link from 'next/link'
import { ChevronLeft, Lock, BookOpen, AlignLeft, GraduationCap } from 'lucide-react'
import { LessonExam } from './_lesson-exam'
import { LessonExercises } from './_lesson-exercises'

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
  const accessible = PLAN_HIERARCHY.indexOf(userPlan) >= PLAN_HIERARCHY.indexOf(lesson.plan_required)

  const { data: progress } = await supabase
    .from('lesson_progress').select('score,status,attempts')
    .eq('user_id', user.id).eq('lesson_id', lesson.id).maybeSingle()

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
        {lesson.plan_required !== 'free' && (
          <span className="text-xs text-verde-600 bg-verde-950/30 border border-verde-900/30 rounded-lg px-2 py-0.5">
            {PLAN_LABELS[lesson.plan_required]}
          </span>
        )}
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-verde-50">{lesson.title}</h1>
      </div>

      {!accessible ? (
        /* ── Paywall ── */
        <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-verde-900/30 flex items-center justify-center mx-auto">
            <Lock size={28} className="text-verde-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-verde-200">Contenuto riservato</h2>
            <p className="text-verde-500 text-sm mt-2 max-w-xs mx-auto">
              Questa lezione richiede il piano <strong className="text-verde-300">{PLAN_LABELS[lesson.plan_required]}</strong>.
            </p>
          </div>
          <Link href="/impostazioni"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-verde-700 hover:bg-verde-600 text-white font-semibold rounded-xl transition-colors text-sm">
            Vedi piani
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

          {/* ── Lesson Content ── */}
          {lesson.content_html && (
            <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlignLeft size={16} className="text-verde-500" />
                <h2 className="font-semibold text-verde-300 text-sm uppercase tracking-wide">Lezione</h2>
              </div>
              <div
                className={[
                  'prose prose-invert prose-sm max-w-none',
                  // Headings
                  '[&_h2]:text-verde-100 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:mb-3 [&_h2]:mt-8',
                  '[&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-verde-800/40',
                  '[&_h3]:text-verde-200 [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base',
                  '[&_h4]:text-verde-300 [&_h4]:font-semibold [&_h4]:mb-1.5 [&_h4]:mt-4 [&_h4]:text-sm',
                  // Text
                  '[&_p]:text-verde-400 [&_p]:leading-relaxed [&_p]:mb-3',
                  '[&_strong]:text-verde-100 [&_strong]:font-bold',
                  '[&_em]:text-verde-300 [&_em]:italic',
                  '[&_hr]:border-verde-800/30 [&_hr]:my-6',
                  // Lists
                  '[&_ul]:text-verde-400 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3',
                  '[&_ol]:text-verde-400 [&_ol]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3',
                  '[&_li]:text-verde-400 [&_li]:leading-relaxed',
                  // Images
                  '[&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4 [&_img]:mx-auto [&_img]:block',
                  '[&_img]:border [&_img]:border-verde-800/30',
                  // ── Tables ──────────────────────────────────────────────
                  '[&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-sm',
                  '[&_table]:rounded-xl [&_table]:overflow-hidden',
                  '[&_thead]:bg-verde-900/60',
                  '[&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-verde-200 [&_th]:font-bold [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide',
                  '[&_th]:border-b [&_th]:border-verde-700/40',
                  '[&_td]:px-3 [&_td]:py-2 [&_td]:text-verde-300 [&_td]:border-b [&_td]:border-verde-900/30',
                  '[&_tbody_tr:last-child_td]:border-b-0',
                  '[&_tbody_tr:hover]:bg-verde-900/20',
                  // ── Blockquote base ──────────────────────────────────────
                  '[&_blockquote]:rounded-xl [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-4',
                  '[&_blockquote]:border-l-4 [&_blockquote]:not-italic',
                  // blockquote.tip → yellow warning box
                  '[&_blockquote.tip]:bg-amber-950/30 [&_blockquote.tip]:border-amber-600/50',
                  '[&_blockquote.tip]:text-amber-200',
                  '[&_blockquote.tip_p]:text-amber-300 [&_blockquote.tip_strong]:text-amber-100',
                  // blockquote.info → blue info box
                  '[&_blockquote.info]:bg-blue-950/30 [&_blockquote.info]:border-blue-600/50',
                  '[&_blockquote.info]:text-blue-200',
                  '[&_blockquote.info_p]:text-blue-300 [&_blockquote.info_strong]:text-blue-100',
                  // blockquote.dialogo → conversation card
                  '[&_blockquote.dialogo]:bg-verde-950/30 [&_blockquote.dialogo]:border-verde-600/50',
                  '[&_blockquote.dialogo]:text-verde-200 [&_blockquote.dialogo]:font-mono [&_blockquote.dialogo]:text-xs',
                  '[&_blockquote.dialogo_p]:mb-1 [&_blockquote.dialogo_p]:text-verde-300',
                  '[&_blockquote.dialogo_strong]:text-verde-100',
                  // Default blockquote (no class)
                  '[&_blockquote:not(.tip):not(.info):not(.dialogo)]:border-verde-700/40',
                  '[&_blockquote:not(.tip):not(.info):not(.dialogo)]:bg-verde-950/20',
                  '[&_blockquote:not(.tip):not(.info):not(.dialogo)]:text-verde-400 [&_blockquote:not(.tip):not(.info):not(.dialogo)]:italic',
                ].join(' ')}
                dangerouslySetInnerHTML={{ __html: lesson.content_html }}
              />
            </div>
          )}

          {/* ── Vocabulary ── */}
          {Array.isArray(lesson.vocabulary) && lesson.vocabulary.length > 0 && (
            <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={16} className="text-verde-500" />
                <h2 className="font-semibold text-verde-300 text-sm uppercase tracking-wide">
                  Vocabolario ({lesson.vocabulary.length} parole)
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lesson.vocabulary.map((item, i) => (
                  <div key={i} className="rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-verde-200 text-sm">{item.word}</span>
                      <span className="text-verde-600 text-xs">→</span>
                      <span className="text-verde-400 text-sm">{item.translation}</span>
                    </div>
                    {item.example && <p className="text-verde-600 text-xs mt-1 italic">{item.example}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Grammar Notes ── */}
          {lesson.grammar_notes && (
            <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6">
              <h2 className="font-semibold text-verde-300 text-sm uppercase tracking-wide mb-3">Note di grammatica</h2>
              <p className="text-verde-400 text-sm leading-relaxed whitespace-pre-line">{lesson.grammar_notes}</p>
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
