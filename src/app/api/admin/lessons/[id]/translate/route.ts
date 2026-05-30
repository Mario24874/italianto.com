import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
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
  // Find first { to last } in case there's leading/trailing prose
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end > start) return raw.slice(start, end + 1)
  return raw.trim()
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

  // Abort after 25s so we return clean JSON before nginx times out
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        signal: controller.signal,
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
      return NextResponse.json(
        { error: `Gemini devolvió error ${response.status}. Intenta de nuevo o reduce el contenido.` },
        { status: 502 }
      )
    }

    const geminiData = await response.json()
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!rawText) {
      console.error('[Gemini translate] empty response', JSON.stringify(geminiData).slice(0, 300))
      return NextResponse.json({ error: 'Gemini devolvió una respuesta vacía. Intenta de nuevo.' }, { status: 502 })
    }

    let translation: LessonTranslation
    try {
      translation = JSON.parse(extractJson(rawText))
    } catch {
      console.error('[Gemini translate JSON parse error]', rawText.slice(0, 500))
      return NextResponse.json(
        { error: 'La IA no devolvió JSON válido. Intenta de nuevo.' },
        { status: 502 }
      )
    }

    // Validate minimum required fields
    if (!translation.content_html) {
      return NextResponse.json({ error: 'Traducción incompleta — falta content_html.' }, { status: 502 })
    }

    const existing = (lesson as LessonRow).translations ?? {}
    const updated = { ...existing, [lang]: translation }

    const { error: updateErr } = await supabase
      .from('lessons')
      .update({ translations: updated, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateErr) throw updateErr

    return NextResponse.json({ translation, lang })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return NextResponse.json(
        { error: 'La traducción tardó demasiado. El contenido es muy largo — intenta dividir la lección en partes más cortas.' },
        { status: 504 }
      )
    }
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/lessons/:id/translate]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    clearTimeout(timeout)
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
