import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createTranslateJob, resolveTranslateJob, rejectTranslateJob } from '../../translate-job/route'
import type { LessonRow, LessonTranslation } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
}

function buildPrompt(lang: string, lesson: LessonRow): string {
  const targetLang = LANG_NAMES[lang] ?? lang
  const vocabJson = JSON.stringify(lesson.vocabulary ?? [])

  return `You are an HTML-aware translator for an Italian language learning platform.
Translate the Spanish instructional text in the HTML below into ${targetLang}.

RULES (strictly enforced):
- Copy every HTML tag, attribute, class, id, and emoji verbatim — do NOT change any HTML structure.
- Emojis at the start of <h2> headings must stay exactly as-is (e.g. "📅 Meses y Días" → "📅 Meses e Giorni").
- DO NOT translate or modify Italian words, phrases, or example sentences — they are the lesson subject matter.
- In tables: translate only Spanish explanation cells; leave cells containing Italian words/examples unchanged.
- Vocabulary: keep "word" (Italian) and "example" (Italian sentence) unchanged; translate only "translation".
- Return ONLY valid JSON — no markdown fences, no prose, no extra text.

JSON output format:
{"content_html":"<translated HTML>","grammar_notes":"<translated notes>","vocabulary":[{"word":"<unchanged>","translation":"<translated to ${targetLang}>","example":"<unchanged>"}]}

SOURCE content_html:
${lesson.content_html}

SOURCE grammar_notes:
${lesson.grammar_notes}

SOURCE vocabulary JSON:
${vocabJson}`
}

/** Strip markdown code fences if Gemini wraps the JSON in them */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end > start) return raw.slice(start, end + 1)
  return raw.trim()
}

/** Background Gemini translation — fire-and-forget from POST */
async function processTranslation(
  apiKey: string,
  lesson: LessonRow,
  lang: string,
  lessonId: string,
  jobId: string
) {
  try {
    const prompt = buildPrompt(lang, lesson)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Gemini translate error]', response.status, errText.slice(0, 500))
      rejectTranslateJob(jobId, `Error de IA (${response.status}). Intenta de nuevo.`)
      return
    }

    const geminiData = await response.json()
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!rawText) {
      console.error('[Gemini translate] empty response', JSON.stringify(geminiData).slice(0, 300))
      rejectTranslateJob(jobId, 'Gemini devolvió una respuesta vacía. Intenta de nuevo.')
      return
    }

    let translation: LessonTranslation
    try {
      translation = JSON.parse(extractJson(rawText))
    } catch {
      console.error('[Gemini translate JSON parse error]', rawText.slice(0, 500))
      rejectTranslateJob(jobId, 'La IA no devolvió JSON válido. Intenta de nuevo.')
      return
    }

    if (!translation.content_html) {
      rejectTranslateJob(jobId, 'Traducción incompleta — falta content_html.')
      return
    }

    const supabase = getSupabaseAdmin()
    const { data: current } = await supabase.from('lessons').select('translations').eq('id', lessonId).single()
    const existing = (current?.translations ?? {}) as Record<string, LessonTranslation>
    const updated = { ...existing, [lang]: translation }

    const { error: updateErr } = await supabase
      .from('lessons')
      .update({ translations: updated, updated_at: new Date().toISOString() })
      .eq('id', lessonId)

    if (updateErr) {
      rejectTranslateJob(jobId, updateErr.message)
      return
    }

    resolveTranslateJob(jobId, translation, lang)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[processTranslation]', msg)
    rejectTranslateJob(jobId, 'Error inesperado al traducir.')
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })
  }

  const { id } = await params
  const body = await req.json()
  const lang = body.lang as string

  if (!['en', 'it', 'es'].includes(lang)) {
    return NextResponse.json({ error: 'lang must be "en", "it", or "es"' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: lesson, error: fetchErr } = await supabase
    .from('lessons').select('*').eq('id', id).single()

  if (fetchErr || !lesson) {
    return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
  }

  // Create job, fire Gemini in background, return immediately (no timeout risk)
  const jobId = createTranslateJob()
  void processTranslation(apiKey, lesson as LessonRow, lang, id, jobId)
  return NextResponse.json({ jobId })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = await params
  const url = new URL(_req.url)
  const lang = url.searchParams.get('lang')

  if (!lang || !['en', 'it', 'es'].includes(lang)) {
    return NextResponse.json({ error: 'lang param required (en, it, or es)' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: lesson } = await supabase.from('lessons').select('translations').eq('id', id).single()
  const translations = { ...(lesson?.translations ?? {}) }
  delete translations[lang as 'en' | 'it' | 'es']

  await supabase.from('lessons').update({ translations, updated_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ ok: true })
}
