import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Exercise, ExerciseTranslations, LessonRow } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
  for (const lang of ['it', 'es', 'en'] as const) {
    if (exTr[lang]?.length) return { exercises: exTr[lang]!, sourceLang: lang }
  }
  if (lesson.exercises?.length) return { exercises: lesson.exercises, sourceLang: 'it' }
  return null
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
5. Return ONLY a valid JSON array — no markdown, no backticks

SOURCE EXERCISES:
${JSON.stringify(exercises, null, 2)}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })

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
    return NextResponse.json({ error: 'No hay ejercicios para traducir. Importa ejercicios primero y guarda la lección.' }, { status: 400 })
  }

  if (source.sourceLang === lang) {
    return NextResponse.json({ error: 'El idioma fuente y destino son iguales.' }, { status: 400 })
  }

  const prompt = buildPrompt(source.exercises, source.sourceLang, lang)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Gemini translate-exercises error]', response.status, errText)
      return NextResponse.json({ error: 'Error al traducir con IA' }, { status: 502 })
    }

    const geminiData = await response.json()
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let exercises: Exercise[]
    try {
      const parsed = JSON.parse(rawText)
      exercises = Array.isArray(parsed) ? parsed : parsed.exercises ?? []
    } catch {
      console.error('[translate-exercises JSON parse error]', rawText.slice(0, 300))
      return NextResponse.json({ error: 'Error al procesar la traducción' }, { status: 502 })
    }

    if (!exercises.length) {
      return NextResponse.json({ error: 'No se pudieron generar ejercicios traducidos' }, { status: 502 })
    }

    const existingTr = ((lesson.exercise_translations ?? {}) as ExerciseTranslations)
    const updatedTr: ExerciseTranslations = { ...existingTr, [lang]: exercises }

    const { error: updateErr } = await supabase
      .from('lessons')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ exercise_translations: updatedTr as any, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateErr) throw updateErr

    return NextResponse.json({ exercises, lang })
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
