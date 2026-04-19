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

  return `You are a professional translator specializing in Italian language learning content.

You will translate this Italian lesson from Spanish to ${targetLang}.

CRITICAL RULES — read carefully:
1. Translate ONLY the instructional/explanatory text (Spanish) into ${targetLang}
2. NEVER translate Italian words, phrases, sentences, or examples — they are the lesson subject matter
3. In HTML tables: translate column headers and Spanish text cells ONLY; leave Italian-content cells unchanged
4. Preserve ALL HTML tags, class attributes, and structure EXACTLY
5. In <blockquote class="tip"> / <blockquote class="info"> / <blockquote class="dialogo">: translate the explanation but keep Italian examples unchanged
6. Return ONLY raw JSON, no markdown, no backticks

Return this exact JSON structure:
{
  "content_html": "...translated HTML here...",
  "grammar_notes": "...translated grammar notes here...",
  "vocabulary": [
    { "word": "unchanged Italian word", "translation": "TRANSLATED to ${targetLang}", "example": "unchanged Italian example sentence" }
  ]
}

For vocabulary: keep "word" field unchanged (it's Italian), translate "translation" field to ${targetLang}, keep "example" field unchanged (it's an Italian example sentence).

SOURCE CONTENT:

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
