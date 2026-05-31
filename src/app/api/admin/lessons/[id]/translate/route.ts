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
      content_html: {
        type: 'string',
        description: 'The translated HTML. Every tag, attribute, class, and emoji must remain identical. Only translate Spanish explanatory text.',
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
    required: ['content_html', 'grammar_notes', 'vocabulary'],
  },
}

function buildSystemPrompt(lang: string): string {
  const targetLang = LANG_NAMES[lang] ?? lang
  return `You are an HTML-aware translator for an Italian language learning platform.
Translate the Spanish instructional text into ${targetLang}.

RULES:
1. Copy every HTML tag, attribute, class, id, and emoji verbatim — do NOT change HTML structure.
2. Emojis at the start of <h2> headings must stay exactly as-is.
3. DO NOT translate Italian vocabulary words or example sentences in the lesson body — they are the study subject. However, Spanish instructional text that DESCRIBES Italian content (explanations, objectives, descriptions) MUST be translated.
4. CRITICAL: The lesson may begin with an introduction BEFORE the first <h2>. This intro contains text in BOTH Italian and Spanish. You MUST include the full intro in your output — keep Italian paragraphs exactly as-is, and translate the Spanish paragraphs to ${targetLang}. Do NOT skip or omit the introduction under any circumstances.
5. In tables: translate Spanish column headers and labels (e.g. "Mes"→"Month", "Lun"→"Mon", "Nº"→"#"). Leave cells that contain Italian words/phrases unchanged.
6. Translate Spanish day and month abbreviations to ${targetLang} equivalents (Lun→Mon, Mar→Tue, Mié→Wed, Jue→Thu, Vie→Fri, Sáb→Sat, Dom→Sun, etc.).
7. Vocabulary array: keep "word" (Italian) and "example" (Italian sentence) unchanged; translate only "translation" to ${targetLang}.
8. You MUST call the save_translation tool with your result. The translated content_html must be at least as long as the original.`
}

function buildUserMessage(lesson: LessonRow, lang: string): string {
  const vocabJson = JSON.stringify(lesson.vocabulary ?? [])
  return `Translate this Italian lesson from Spanish to ${LANG_NAMES[lang] ?? lang}.

content_html:
${lesson.content_html}

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

    const translation = toolBlock.input as LessonTranslation

    if (!translation.content_html) {
      rejectTranslateJob(jobId, 'Traducción incompleta — falta content_html.')
      return
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
