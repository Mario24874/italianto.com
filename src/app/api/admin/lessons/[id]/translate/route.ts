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

/** Split HTML into intro (everything before first <h2>) and body (from first <h2> onwards) */
function splitIntro(html: string): { intro: string; body: string } {
  const idx = html.search(/<h2[\s>]/i)
  if (idx === -1) return { intro: '', body: html }
  return { intro: html.slice(0, idx).trim(), body: html.slice(idx) }
}

/**
 * Return the best Spanish source HTML to translate from.
 * lesson.content_html (Gemini import) may start directly at <h2> with no intro.
 * Falls back to another language's translation that has an intro — but NEVER
 * to the target language itself (that would be circular: translating ES→ES).
 */
function getSourceHtml(lesson: LessonRow, targetLang: string): string {
  const raw = lesson.content_html ?? ''
  if (splitIntro(raw).intro) return raw

  // Check other translations for one that has an intro, skipping the target language
  for (const lang of ['it', 'es', 'en'] as const) {
    if (lang === targetLang) continue  // never use the target as its own source
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = ((lesson as any).translations?.[lang]?.content_html ?? '') as string
    if (html && splitIntro(html).intro) return html
  }

  return raw
}

/** Translate a short HTML snippet with a direct call — no tool use needed */
async function translateHtmlSnippet(
  client: Anthropic,
  html: string,
  targetLang: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Translate the following HTML from Spanish to ${targetLang}.
Rules:
- Preserve ALL HTML tags, attributes, classes, and emojis exactly as-is.
- Only translate the Spanish text content between tags.
- Do NOT add any explanation, preamble, or markdown — output the HTML directly.

${html}`,
    }],
  })
  const block = response.content.find(b => b.type === 'text')
  return block?.type === 'text' ? block.text.trim() : ''
}

const BODY_TOOL: Anthropic.Tool = {
  name: 'save_translation',
  description: 'Save the translated lesson body, grammar notes, and vocabulary.',
  input_schema: {
    type: 'object' as const,
    properties: {
      body_html: {
        type: 'string',
        description: 'Translated HTML body — from the first <h2> to the end. Preserve every tag, attribute, class, and emoji.',
      },
      grammar_notes: {
        type: 'string',
        description: 'Translated grammar notes (plain text).',
      },
      vocabulary: {
        type: 'array',
        description: 'Vocabulary array. Keep "word" (Italian) and "example" (Italian) unchanged. Translate only "translation".',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            translation: { type: 'string' },
            example: { type: 'string' },
          },
          required: ['word', 'translation'],
        },
      },
    },
    required: ['body_html', 'grammar_notes', 'vocabulary'],
  },
}

function buildBodyPrompt(lang: string): string {
  const targetLang = LANG_NAMES[lang] ?? lang
  return `You are an HTML-aware translator for an Italian language learning platform.
Translate Spanish instructional text to ${targetLang}.

RULES:
1. Preserve every HTML tag, attribute, class, id, and emoji verbatim.
2. Emojis at the start of <h2> headings stay exactly as-is.
3. Do NOT translate Italian: standalone words, conjugation tables, or study-content phrases. Spanish sentences that describe Italian ARE instructional and must be translated.
4. Tables: translate Spanish column headers (Mes→Month, Lun→Mon, Nº→#). Leave Italian-word cells unchanged.
5. Translate Spanish day/month abbreviations (Lun→Mon, Mar→Tue, Mié→Wed, Jue→Thu, Vie→Fri, Sáb→Sat, Dom→Sun).
6. Vocabulary: keep "word" and "example" (Italian) unchanged; translate only "translation".
7. Call the save_translation tool with your result.`
}

function buildBodyMessage(lesson: LessonRow, lang: string, body: string): string {
  return `Translate this Italian lesson body from Spanish to ${LANG_NAMES[lang] ?? lang}.

body_html (from the first <h2> to the end):
${body}

grammar_notes:
${lesson.grammar_notes ?? ''}

vocabulary:
${JSON.stringify(lesson.vocabulary ?? [])}`
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
    const targetLang = LANG_NAMES[lang] ?? lang
    const sourceHtml = getSourceHtml(lesson, lang)
    const { intro, body } = splitIntro(sourceHtml)

    console.log(`[translate:${lang}] intro=${intro.length}chars body=${body.length}chars lesson=${lessonId}`)

    // ── Step 1: translate intro independently (if it exists) ──────────────────
    // Isolated call → model has nothing else to do, cannot skip the intro.
    let introHtml = ''
    if (intro) {
      introHtml = await translateHtmlSnippet(client, intro, targetLang)
      console.log(`[translate:${lang}] intro translated → ${introHtml.length}chars`)
    }

    // ── Step 2: translate body + grammar + vocabulary with tool_use ───────────
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16000,
      system: buildBodyPrompt(lang),
      tools: [BODY_TOOL],
      tool_choice: { type: 'tool', name: 'save_translation' },
      messages: [{ role: 'user', content: buildBodyMessage(lesson, lang, body) }],
    })

    const toolBlock = message.content.find(b => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      rejectTranslateJob(jobId, `Claude no llamó la herramienta (stop_reason: ${message.stop_reason}). Intenta de nuevo.`)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = toolBlock.input as any
    if (!raw.body_html) {
      rejectTranslateJob(jobId, 'Traducción incompleta — falta body_html.')
      return
    }

    // ── Step 3: assemble final content_html ───────────────────────────────────
    const bodyHtml = (raw.body_html as string).trim()
    const fullContentHtml = introHtml ? `${introHtml}\n${bodyHtml}` : bodyHtml

    const translation: LessonTranslation = {
      content_html: fullContentHtml,
      grammar_notes: (raw.grammar_notes as string) ?? '',
      vocabulary: (raw.vocabulary as LessonTranslation['vocabulary']) ?? [],
    }

    const supabase = getSupabaseAdmin()
    const { data: current } = await supabase.from('lessons').select('translations').eq('id', lessonId).single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = ((current as any)?.translations ?? {}) as Record<string, LessonTranslation>
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
    rejectTranslateJob(jobId, `Error: ${msg}`)
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
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada en Easypanel' }, { status: 500 })
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const translations = { ...((lesson as any)?.translations ?? {}) }
  delete translations[lang as 'en' | 'it' | 'es']

  await supabase.from('lessons').update({ translations, updated_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ ok: true })
}
