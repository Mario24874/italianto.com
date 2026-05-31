import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { LessonRow } from '@/types'
import { logApiUsage } from '@/lib/api-usage'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const LANG_NAMES: Record<string, string> = { en: 'English', it: 'Italian', es: 'Spanish' }

function splitIntro(html: string): { intro: string; body: string } {
  const idx = html.search(/<h2[\s>]/i)
  if (idx === -1) return { intro: '', body: html }
  return { intro: html.slice(0, idx).trim(), body: html.slice(idx) }
}

function stripFences(text: string): string {
  const fenced = text.match(/^```(?:html)?\s*([\s\S]*?)```\s*$/)
  return fenced ? fenced[1].trim() : text.trim()
}

async function translateSnippet(client: Anthropic, html: string, from: string, to: string): Promise<string> {
  if (!html.trim()) return ''
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Translate this HTML from ${from} to ${to}.
- Preserve ALL HTML tags, attributes, classes, inline styles and emojis exactly.
- Translate only the ${from} text content between tags.
- Italian study words/examples that ARE the lesson subject stay in Italian; instructional sentences get translated.
- Output the HTML directly, no markdown fences, no explanation.

${html}`,
    }],
  })
  void logApiUsage('claude-haiku', 'normalize-content', res.usage.input_tokens, res.usage.output_tokens)
  const block = res.content.find(b => b.type === 'text')
  return block?.type === 'text' ? stripFences(block.text) : ''
}

const BODY_TOOL: Anthropic.Tool = {
  name: 'save',
  description: 'Save translated body, grammar_notes and vocabulary.',
  input_schema: {
    type: 'object' as const,
    properties: {
      body_html: { type: 'string', description: 'Translated HTML body from the first <h2> to the end. Preserve every tag/attr/class/style/emoji.' },
      grammar_notes: { type: 'string' },
      vocabulary: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: true,
          properties: { word: { type: 'string' }, translation: { type: 'string' }, example: { type: 'string' } },
          required: ['word', 'translation'],
        },
      },
    },
    required: ['body_html', 'grammar_notes', 'vocabulary'],
  },
}

/**
 * One-time normalizer: translate content_html / grammar_notes / vocabulary
 * from `from` language to `to` (default Spanish) and write the result back as
 * the canonical base. Also clears the `to` translation so the viewer falls back
 * to the now-correct base, and clears stale translations that should be regen'd.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })

    const { id } = await params
    let from = 'it'
    let to = 'es'
    try {
      const body = await req.json()
      if (body.from) from = body.from
      if (body.to) to = body.to
    } catch { /* defaults */ }

    if (!LANG_NAMES[from] || !LANG_NAMES[to]) {
      return NextResponse.json({ error: 'from/to deben ser en, it o es' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: lessonRaw, error: fetchErr } = await supabase
      .from('lessons').select('*').eq('id', id).single()
    if (fetchErr || !lessonRaw) return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })

    const lesson = lessonRaw as LessonRow
    const fromName = LANG_NAMES[from]
    const toName = LANG_NAMES[to]
    const { intro, body } = splitIntro(lesson.content_html ?? '')

    console.log(`[normalize] lesson=${id} ${from}→${to} intro=${intro.length} body=${body.length}`)

    const client = new Anthropic({ apiKey })

    // 1) intro (isolated call)
    const introTranslated = intro ? await translateSnippet(client, intro, fromName, toName) : ''

    // 2) body + grammar + vocabulary (tool_use)
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16000,
      tools: [BODY_TOOL],
      tool_choice: { type: 'tool', name: 'save' },
      messages: [{
        role: 'user',
        content: `Translate this Italian-lesson content from ${fromName} to ${toName}.
Preserve every HTML tag/attr/class/inline-style/emoji. Italian study words/tables/examples stay Italian; instructional sentences get translated. Translate Spanish/foreign table headers to ${toName}.

body_html (from first <h2>):
${body}

grammar_notes:
${lesson.grammar_notes ?? ''}

vocabulary:
${JSON.stringify(lesson.vocabulary ?? [])}`,
      }],
    })
    void logApiUsage('claude-haiku', 'normalize-content', msg.usage.input_tokens, msg.usage.output_tokens)

    const tool = msg.content.find(b => b.type === 'tool_use')
    if (!tool || tool.type !== 'tool_use') {
      return NextResponse.json({ error: `Sin tool_use (stop: ${msg.stop_reason})` }, { status: 502 })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = tool.input as any
    if (!raw.body_html) return NextResponse.json({ error: 'Falta body_html' }, { status: 502 })

    const newContentHtml = introTranslated ? `${introTranslated}\n${raw.body_html.trim()}` : raw.body_html.trim()

    // 3) write back as canonical base + clear stale translations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingTr = ((lesson as any).translations ?? {}) as Record<string, unknown>
    const cleanedTr = { ...existingTr }
    delete cleanedTr[to]   // viewer will fall back to the now-correct base
    delete cleanedTr[from] // stale: regenerate from the new base

    const { error: updErr } = await supabase
      .from('lessons')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        content_html: newContentHtml,
        grammar_notes: raw.grammar_notes ?? lesson.grammar_notes,
        vocabulary: raw.vocabulary ?? lesson.vocabulary,
        translations: cleanedTr,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      content_html_preview: newContentHtml.slice(0, 200),
      cleared: [to, from],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[normalize-content]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
