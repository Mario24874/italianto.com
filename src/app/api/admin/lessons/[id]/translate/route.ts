import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
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

function buildSystemPrompt(lang: string): string {
  const targetLang = LANG_NAMES[lang] ?? lang
  return `You are an HTML-aware translator for an Italian language learning platform.
Your task: translate Spanish instructional text into ${targetLang}.

STRICT RULES:
- Copy every HTML tag, attribute, class, id, and emoji verbatim — do NOT change any HTML structure.
- Emojis at the start of <h2> headings must stay exactly as-is.
- DO NOT translate or modify Italian words, phrases, or example sentences — they are the lesson subject matter.
- In tables: translate only Spanish explanation cells; leave cells containing Italian words/examples unchanged.
- Vocabulary array: keep "word" (Italian) and "example" (Italian sentence) unchanged; translate only "translation".

OUTPUT: Return ONLY a valid JSON object. No markdown, no code fences, no prose. Just the JSON.

JSON format:
{"content_html":"<translated HTML>","grammar_notes":"<translated notes>","vocabulary":[{"word":"<unchanged>","translation":"<translated to ${targetLang}>","example":"<unchanged>"}]}`
}

function buildUserMessage(lesson: LessonRow): string {
  const vocabJson = JSON.stringify(lesson.vocabulary ?? [])
  return `Translate the following lesson content.

SOURCE content_html:
${lesson.content_html}

SOURCE grammar_notes:
${lesson.grammar_notes}

SOURCE vocabulary JSON:
${vocabJson}`
}

/** Background Claude translation — fire-and-forget from POST */
async function processTranslation(
  apiKey: string,
  lesson: LessonRow,
  lang: string,
  lessonId: string,
  jobId: string
) {
  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8096,
      system: buildSystemPrompt(lang),
      messages: [
        { role: 'user', content: buildUserMessage(lesson) },
      ],
    })

    const block = message.content.find(b => b.type === 'text')
    const rawText = block?.type === 'text' ? block.text : ''

    if (!rawText) {
      rejectTranslateJob(jobId, 'Claude devolvió una respuesta vacía. Intenta de nuevo.')
      return
    }

    // Strip markdown fences if present
    let jsonStr = rawText.trim()
    const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenced) jsonStr = fenced[1].trim()
    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')
    if (start !== -1 && end > start) jsonStr = jsonStr.slice(start, end + 1)

    let translation: LessonTranslation
    try {
      translation = JSON.parse(jsonStr)
    } catch {
      console.error('[Claude translate JSON parse error]', rawText.slice(0, 500))
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
    rejectTranslateJob(jobId, `Error inesperado: ${msg}`)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })
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

  // Create job, fire Claude in background, return immediately (no timeout risk)
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
