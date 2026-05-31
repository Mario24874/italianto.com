import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Exercise, ExerciseTranslations, LessonRow } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
}

function findSource(lesson: Pick<LessonRow, 'exercises' | 'exercise_translations'>): {
  exercises: Exercise[]
  sourceLang: string
} | null {
  const exTr = (lesson.exercise_translations ?? {}) as ExerciseTranslations
  const legacyCount = lesson.exercises?.length ?? 0

  let bestTr: { exercises: Exercise[]; sourceLang: string } | null = null
  for (const lang of ['it', 'es', 'en'] as const) {
    if ((exTr[lang]?.length ?? 0) > (bestTr?.exercises.length ?? 0)) {
      bestTr = { exercises: exTr[lang]!, sourceLang: lang }
    }
  }

  if (legacyCount > 0 && legacyCount >= (bestTr?.exercises.length ?? 0)) {
    return { exercises: lesson.exercises!, sourceLang: 'es' }
  }

  return bestTr
}

function buildPrompt(exercises: Exercise[], sourceLang: string, targetLang: string): string {
  const src = LANG_NAMES[sourceLang] ?? sourceLang
  const tgt = LANG_NAMES[targetLang] ?? targetLang
  return `You are a professional translator for an Italian language learning app.
Translate the following interactive exercises from ${src} to ${tgt}.

RULES:
1. TRANSLATE to ${tgt}: "title", "instruction", "section" (keep emoji, translate text only), fill_blank items "label" and "placeholder", free_write fields "prefix" and "placeholder", choice "questions[].text"
2. DO NOT translate: "answer" fields (correct Italian responses), "wordBank" entries (Italian words), dialogue "lines[].text" (Italian dialogue), "answerPanel" entries, letter options (A–Z) in choice exercises
3. For "options[].value": translate if descriptive label (e.g. "Formal", "Informal", "Both"); keep if Italian content or single letters
4. Keep ALL structural fields exactly as-is: id, type, number, multiSelect, answers, correct, wordBank, lines, answerPanel
5. Call the save_exercises tool with the translated array.

SOURCE EXERCISES:
${JSON.stringify(exercises, null, 2)}`
}

const EXERCISES_TOOL: Anthropic.Tool = {
  name: 'save_exercises',
  description: 'Save the translated exercises array.',
  input_schema: {
    type: 'object' as const,
    properties: {
      exercises: {
        type: 'array',
        description: 'Translated exercises with the same structure as the input. Every structural field preserved, only instructional text translated.',
        items: { type: 'object' as const },
      },
    },
    required: ['exercises'],
  },
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })

  const { id } = await params
  const body = await req.json()
  const lang = body.lang as string

  if (!['en', 'it', 'es'].includes(lang)) {
    return NextResponse.json({ error: 'lang debe ser "en", "it" o "es"' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: lessonRaw, error: fetchErr } = await supabase
    .from('lessons').select('exercises, exercise_translations').eq('id', id).single()

  if (fetchErr || !lessonRaw) {
    return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
  }

  const lesson = lessonRaw as Pick<LessonRow, 'exercises' | 'exercise_translations'>
  const source = findSource(lesson)

  if (!source) {
    return NextResponse.json({ error: 'No hay ejercicios para traducir. Importa ejercicios primero.' }, { status: 400 })
  }

  // Same-language: copy as-is, no translation needed
  if (source.sourceLang === lang) {
    const existingTr = ((lesson.exercise_translations ?? {}) as ExerciseTranslations)
    const updatedTr: ExerciseTranslations = { ...existingTr, [lang]: source.exercises }
    const { error: updateErr } = await supabase
      .from('lessons')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ exercise_translations: updatedTr as any, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (updateErr) return NextResponse.json({ error: String(updateErr) }, { status: 500 })
    return NextResponse.json({ exercises: source.exercises, lang })
  }

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      tools: [EXERCISES_TOOL],
      tool_choice: { type: 'tool', name: 'save_exercises' },
      messages: [{ role: 'user', content: buildPrompt(source.exercises, source.sourceLang, lang) }],
    })

    const toolBlock = message.content.find(b => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json({ error: 'Error al traducir. Intenta de nuevo.' }, { status: 502 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = toolBlock.input as any
    const translated: Exercise[] = Array.isArray(raw.exercises) ? raw.exercises : []

    if (!translated.length) {
      return NextResponse.json({ error: 'No se generaron ejercicios traducidos.' }, { status: 502 })
    }

    const existingTr = ((lesson.exercise_translations ?? {}) as ExerciseTranslations)
    const updatedTr: ExerciseTranslations = { ...existingTr, [lang]: translated }

    const { error: updateErr } = await supabase
      .from('lessons')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ exercise_translations: updatedTr as any, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateErr) throw updateErr

    return NextResponse.json({ exercises: translated, lang })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/lessons/:id/translate-exercises]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const url = new URL(_req.url)
  const lang = url.searchParams.get('lang')

  if (!lang || !['en', 'it', 'es'].includes(lang)) {
    return NextResponse.json({ error: 'lang param requerido (en, it o es)' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: lesson } = await supabase
    .from('lessons').select('exercise_translations').eq('id', id).single()

  const exTr = { ...((lesson?.exercise_translations ?? {}) as ExerciseTranslations) }
  delete exTr[lang as keyof ExerciseTranslations]

  await supabase.from('lessons')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ exercise_translations: exTr as any, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
