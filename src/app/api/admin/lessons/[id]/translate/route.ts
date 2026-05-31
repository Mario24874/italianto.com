import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createTranslateJob, resolveTranslateJob, rejectTranslateJob } from '../../translate-job/route'
import type { LessonRow, LessonTranslation } from '@/types'
import { logApiUsage } from '@/lib/api-usage'

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

/** Strip markdown code fences that haiku sometimes adds despite instructions */
function stripFences(text: string): string {
  const fenced = text.match(/^```(?:html)?\s*([\s\S]*?)```\s*$/)
  return fenced ? fenced[1].trim() : text.trim()
}

/** Translate a short HTML snippet with a direct call — no tool use needed */
async function translateHtmlSnippet(
  client: Anthropic,
  html: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Translate the following HTML from ${sourceLang} to ${targetLang}.
Rules:
- Preserve ALL HTML tags, attributes, classes, and emojis exactly as-is.
- Only translate the ${sourceLang} text content between tags.
- Do NOT add any explanation, preamble, or markdown code fences — output the HTML directly.

${html}`,
    }],
  })
  void logApiUsage('claude-haiku', 'translate-intro', response.usage.input_tokens, response.usage.output_tokens)
  const block = response.content.find(b => b.type === 'text')
  return block?.type === 'text' ? stripFences(block.text) : ''
}

/** Generate a Spanish intro (context + objectives) from the body's <h2> section headings */
async function generateSpanishIntro(client: Anthropic, body: string): Promise<string> {
  const headings = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
  if (headings.length === 0) return ''

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Genera una introducción en español (HTML) para una lección de italiano.
Debe tener exactamente:
1. Un párrafo <p> de contexto que describa de qué trata la lección.
2. <p><strong>Objetivos de la lección:</strong></p> seguido de una <ul> con un <li> por cada tema, cada <li> empezando con un emoji apropiado.

Las secciones de la lección son:
${headings.map(h => `- ${h}`).join('\n')}

Devuelve SOLO el HTML del intro. NO incluyas ningún <h2>. Sin markdown, sin explicación.`,
    }],
  })
  void logApiUsage('claude-haiku', 'generate-intro', response.usage.input_tokens, response.usage.output_tokens)
  const block = response.content.find(b => b.type === 'text')
  return block?.type === 'text' ? stripFences(block.text) : ''
}

/**
 * PERMANENT FIX: ensure content_html starts with a Spanish intro.
 * Lessons imported before the intro rule begin directly at <h2>. This backfills
 * a Spanish intro (borrowed from an existing translation, or generated from the
 * section headings) and persists it into content_html so it becomes canonical
 * for the default ES view AND the source for every future translation.
 * Idempotent: once content_html has an intro, this is a no-op.
 */
async function ensureContentHtmlIntro(
  client: Anthropic,
  lesson: LessonRow,
  lessonId: string
): Promise<string> {
  const raw = lesson.content_html ?? ''
  const { intro, body } = splitIntro(raw)
  if (intro) return raw  // already canonical

  // Always GENERATE the Spanish intro from the body's section headings.
  // We deliberately do NOT borrow from translations[*] — those may be corrupted
  // (e.g. an old ES translation containing Italian text). Generating from the
  // body is deterministic and always produces Spanish.
  if (!body) return raw
  const spanishIntro = await generateSpanishIntro(client, body)
  if (!spanishIntro) return raw  // nothing we can backfill

  const healed = `${spanishIntro}\n${raw}`
  const supabase = getSupabaseAdmin()
  await supabase
    .from('lessons')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ content_html: healed, updated_at: new Date().toISOString() } as any)
    .eq('id', lessonId)
  console.log(`[translate] backfilled Spanish intro into content_html (${spanishIntro.length}chars) lesson=${lessonId}`)
  return healed
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

function buildBodyPrompt(lang: string, srcLang: string): string {
  const targetLang = LANG_NAMES[lang] ?? lang
  const sourceLang = LANG_NAMES[srcLang] ?? srcLang
  return `You are an HTML-aware translator for an Italian language learning platform.
Translate ${sourceLang} instructional text to ${targetLang}.

RULES:
1. Preserve every HTML tag, attribute, class, id, and emoji verbatim.
2. Emojis at the start of <h2> headings stay exactly as-is.
3. Do NOT translate Italian standalone words, conjugation tables, or study-content phrases. Sentences that describe Italian ARE instructional and must be translated.
4. Tables: translate column headers to ${targetLang} (Mes→Month/Mese, Lun→Mon/Lun, Nº→#). Leave Italian-word cells unchanged.
5. Translate day/month abbreviations to ${targetLang} equivalents.
6. Vocabulary: keep "word" and "example" (Italian) unchanged; translate only "translation".
7. Call the save_translation tool with your result.`
}

function buildBodyMessage(lesson: LessonRow, lang: string, body: string, srcLang: string): string {
  const sourceLang = LANG_NAMES[srcLang] ?? srcLang
  const targetLang = LANG_NAMES[lang] ?? lang
  return `Translate this Italian lesson body from ${sourceLang} to ${targetLang}.

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

    // PERMANENT FIX: make sure content_html has a Spanish intro (self-healing,
    // idempotent). After this runs once, content_html is canonical for all langs.
    const rawHtml = await ensureContentHtmlIntro(client, lesson, lessonId)

    // The BODY always comes from content_html — the canonical Spanish original
    // generated by Gemini, whose headings ("Pronunciación", "Meses y Días") are
    // already in Spanish. Translating IT→ES would make haiku treat those Italian
    // headings as study content and leave them in Italian. content_html is the
    // single source of truth for the body.
    const { intro: ownIntro, body: spanishBody } = splitIntro(rawHtml)

    // The INTRO needs a fallback only because older lessons were imported before
    // the intro rule existed (their content_html starts directly at <h2>).
    // Prefer content_html's own Spanish intro; else borrow from another
    // translation that has one. Strip stray markdown fences from the source.
    let introSourceHtml = stripFences(ownIntro)
    let introSourceLang = 'es'
    if (!introSourceHtml) {
      for (const l of ['es', 'it', 'en'] as const) {
        if (l === lang) continue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tHtml = ((lesson as any).translations?.[l]?.content_html ?? '') as string
        const tIntro = stripFences(splitIntro(tHtml).intro)
        if (tIntro) { introSourceHtml = tIntro; introSourceLang = l; break }
      }
    }

    console.log(`[translate:${lang}] body=${spanishBody.length}chars(es) intro=${introSourceHtml.length}chars(${introSourceLang}) lesson=${lessonId}`)

    // ── Step 1: resolve intro ─────────────────────────────────────────────────
    let introHtml = ''
    if (introSourceHtml) {
      if (introSourceLang === lang) {
        introHtml = introSourceHtml  // already in target language
        console.log(`[translate:${lang}] intro copied as-is (source=target)`)
      } else {
        introHtml = await translateHtmlSnippet(
          client, introSourceHtml, LANG_NAMES[introSourceLang] ?? introSourceLang, targetLang
        )
        console.log(`[translate:${lang}] intro translated ${introSourceLang}→${lang} → ${introHtml.length}chars`)
      }
    }

    // ── Step 2: resolve body + grammar + vocabulary ───────────────────────────
    let bodyHtml: string
    let grammarNotes: string
    let vocabulary: LessonTranslation['vocabulary']

    if (lang === 'es') {
      // Target is the original language — body/grammar/vocab are already Spanish.
      // No Claude call needed (and translating ES→ES could corrupt content).
      bodyHtml = spanishBody.trim()
      grammarNotes = lesson.grammar_notes ?? ''
      vocabulary = (lesson.vocabulary ?? []) as LessonTranslation['vocabulary']
      console.log(`[translate:es] body/grammar/vocab copied from original (no API call)`)
    } else {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 16000,
        system: buildBodyPrompt(lang, 'es'),
        tools: [BODY_TOOL],
        tool_choice: { type: 'tool', name: 'save_translation' },
        messages: [{ role: 'user', content: buildBodyMessage(lesson, lang, spanishBody, 'es') }],
      })

      void logApiUsage('claude-haiku', `translate:${lang}`, message.usage.input_tokens, message.usage.output_tokens)

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

      bodyHtml = (raw.body_html as string).trim()
      grammarNotes = (raw.grammar_notes as string) ?? ''
      vocabulary = (raw.vocabulary as LessonTranslation['vocabulary']) ?? []
    }

    // ── Step 3: assemble final content_html ───────────────────────────────────
    const fullContentHtml = introHtml ? `${introHtml}\n${bodyHtml}` : bodyHtml

    const translation: LessonTranslation = {
      content_html: fullContentHtml,
      grammar_notes: grammarNotes,
      vocabulary,
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
