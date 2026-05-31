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

const TRANSLATION_TOOL: Anthropic.Tool = {
  name: 'save_translation',
  description: 'Save the translated lesson content. Do not modify Italian words or HTML structure.',
  input_schema: {
    type: 'object' as const,
    properties: {
      intro_html: {
        type: 'string',
        description: 'Translated HTML of the INTRODUCTION — everything that appears BEFORE the first <h2> tag. Preserve all tags, classes, and emojis. If the original intro is empty, use empty string.',
      },
      body_html: {
        type: 'string',
        description: 'Translated HTML of the BODY — everything starting from the first <h2> tag to the end. Every tag, attribute, class, and emoji must remain identical.',
      },
      grammar_notes: {
        type: 'string',
        description: 'Translated grammar notes (plain text).',
      },
      vocabulary: {
        type: 'array',
        description: 'Vocabulary array. Keep "word" and "example" unchanged (Italian). Translate only "translation".',
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
    required: ['intro_html', 'body_html', 'grammar_notes', 'vocabulary'],
  },
}

/** Split HTML into the intro (before first <h2>) and the body (from first <h2> onwards) */
function splitIntro(html: string): { intro: string; body: string } {
  const match = html.match(/^([\s\S]*?)(<h2[\s>][\s\S]*)$/i)
  if (!match) return { intro: '', body: html }
  return { intro: match[1].trim(), body: match[2] }
}

function buildSystemPrompt(lang: string): string {
  const targetLang = LANG_NAMES[lang] ?? lang
  return `You are an HTML-aware translator for an Italian language learning platform.
Translate the Spanish instructional text into ${targetLang}.

RULES:
1. Copy every HTML tag, attribute, class, id, and emoji verbatim — do NOT change HTML structure.
2. Emojis at the start of <h2> headings must stay exactly as-is.
3. The content is split into TWO separate fields: intro_html (before the first <h2>) and body_html (from the first <h2> to the end). Translate BOTH completely.
4. "Do not translate Italian" means: do NOT translate Italian standalone words, conjugation tables, or example phrases that ARE the study content. Spanish sentences that describe Italian (e.g. "El alfabeto italiano tiene 21 letras") ARE instructional text and must be translated.
5. In tables: translate Spanish column headers and labels (e.g. "Mes"→"Month", "Lun"→"Mon", "Nº"→"#"). Leave cells that contain Italian words/phrases unchanged.
6. Translate Spanish day and month abbreviations to ${targetLang} equivalents (Lun→Mon, Mar→Tue, Mié→Wed, Jue→Thu, Vie→Fri, Sáb→Sat, Dom→Sun, etc.).
7. Vocabulary array: keep "word" (Italian) and "example" (Italian sentence) unchanged; translate only "translation" to ${targetLang}.
8. You MUST call the save_translation tool with your result.`
}

function buildUserMessage(lesson: LessonRow, lang: string): string {
  const vocabJson = JSON.stringify(lesson.vocabulary ?? [])
  const { intro, body } = splitIntro(lesson.content_html ?? '')
  return `Translate this Italian lesson from Spanish to ${LANG_NAMES[lang] ?? lang}.

INTRO (everything before the first <h2> — translate this into intro_html):
${intro || '(empty)'}

BODY (from the first <h2> to the end — translate this into body_html):
${body}

grammar_notes:
${lesson.grammar_notes ?? ''}

vocabulary:
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
      max_tokens: 16000,
      system: buildSystemPrompt(lang),
      tools: [TRANSLATION_TOOL],
      tool_choice: { type: 'tool', name: 'save_translation' },
      messages: [
        { role: 'user', content: buildUserMessage(lesson, lang) },
      ],
    })

    // With tool_choice forced, the response must contain a tool_use block
    const toolBlock = message.content.find(b => b.type === 'tool_use')

    if (!toolBlock || toolBlock.type !== 'tool_use') {
      const stopReason = message.stop_reason
      console.error('[Claude translate] no tool_use block, stop_reason:', stopReason, JSON.stringify(message.content).slice(0, 300))
      rejectTranslateJob(jobId, `Claude no llamó la herramienta de traducción (stop_reason: ${stopReason}). Intenta de nuevo.`)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = toolBlock.input as any
    if (!raw.body_html) {
      rejectTranslateJob(jobId, 'Traducción incompleta — falta body_html.')
      return
    }

    // Reconstruct full content_html from the two separately-translated fields.
    // If the model returned empty intro_html despite the Spanish having an intro,
    // make a second focused call to translate just the intro.
    const { intro: spanishIntro } = splitIntro(lesson.content_html ?? '')
    let introHtml = (raw.intro_html ?? '').trim()
    const bodyHtml = (raw.body_html ?? '').trim()

    if (!introHtml && spanishIntro) {
      console.warn('[translate] intro_html vacío — reintentando traducción del intro por separado')
      try {
        const introMsg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `Translate this HTML snippet from Spanish to ${LANG_NAMES[lang] ?? lang}. Preserve ALL HTML tags, attributes, classes, and emojis exactly. Only translate the Spanish text content.\n\n${spanishIntro}`,
          }],
        })
        const textBlock = introMsg.content.find(b => b.type === 'text')
        if (textBlock && textBlock.type === 'text' && textBlock.text.trim()) {
          introHtml = textBlock.text.trim()
        }
      } catch (e) {
        console.error('[translate] fallo al traducir intro por separado:', e)
      }
    }

    const translation: LessonTranslation = {
      content_html: introHtml ? `${introHtml}\n${bodyHtml}` : bodyHtml,
      grammar_notes: raw.grammar_notes ?? '',
      vocabulary: raw.vocabulary ?? [],
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
