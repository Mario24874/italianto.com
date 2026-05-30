import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { LessonRow, LessonTranslation, VocabularyItem } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
}

function buildPrompt(lang: string, lesson: LessonRow): string {
  const targetLang = LANG_NAMES[lang] ?? lang
  const vocabJson = JSON.stringify(lesson.vocabulary ?? [])

  return `You are a professional HTML-aware translator for an Italian language learning platform.

## Task
Translate the Spanish instructional text in the HTML below into ${targetLang}, while keeping the HTML structure byte-for-byte identical.

## Absolute rules (violations cause rejection):
1. OUTPUT must be valid JSON — no markdown fences, no extra text outside the JSON object.
2. DO NOT change any HTML tag, attribute, class name, id, emoji, or structure. Copy every <tag>, </tag>, and attribute verbatim.
3. DO NOT translate or alter Italian words, sentences, or examples (they are the lesson subject matter — the thing being taught). Identify Italian by recognising Italian words; leave them as-is.
4. DO translate only the Spanish explanatory/instructional text that surrounds Italian content.
5. Tables: translate <th> and <td> cells that contain Spanish text only. Keep cells containing Italian words or grammatical examples unchanged.
6. Emojis at the start of <h2> headings must be kept exactly as-is.
7. <blockquote class="tip">, <blockquote class="info">, <blockquote class="dialogo">: translate the Spanish explanation; keep Italian words/examples unchanged.
8. Vocabulary: keep "word" (Italian) and "example" (Italian sentence) unchanged; translate only "translation" to ${targetLang}.

## OUTPUT format (return exactly this JSON, nothing else):
{
  "content_html": "<exact HTML with only Spanish text translated>",
  "grammar_notes": "<grammar notes translated to ${targetLang}>",
  "vocabulary": [{ "word": "<unchanged>", "translation": "<translated to ${targetLang}>", "example": "<unchanged>" }]
}

## SOURCE

content_html:
${lesson.content_html}

grammar_notes:
${lesson.grammar_notes}

vocabulary (JSON):
${vocabJson}`
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

  const prompt = buildPrompt(lang, lesson as LessonRow)

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
      console.error('[Gemini translate error]', response.status, errText)
      return NextResponse.json({ error: 'Error al traducir con IA' }, { status: 502 })
    }

    const geminiData = await response.json()
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let translation: LessonTranslation
    try {
      translation = JSON.parse(rawText)
    } catch {
      console.error('[Gemini translate JSON parse error]', rawText.slice(0, 300))
      return NextResponse.json({ error: 'Error al procesar la traducción' }, { status: 502 })
    }

    // Merge into existing translations object
    const existing = (lesson as LessonRow).translations ?? {}
    const updated = { ...existing, [lang]: translation }

    const { error: updateErr } = await supabase
      .from('lessons')
      .update({ translations: updated, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateErr) throw updateErr

    return NextResponse.json({ translation, lang })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/lessons/:id/translate]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
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
