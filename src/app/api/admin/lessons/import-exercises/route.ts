import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAdmin } from '@/lib/admin'
import type { Exercise } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Convert HTML to readable plain text, preserving structure with newlines */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<\/th>/gi, '\t')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<h[1-6][^>]*>/gi, '\n### ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function buildPrompt(language: string): string {
  const langLabel = language === 'en' ? 'English' : language === 'it' ? 'italiano' : 'español'

  return `Eres un experto en didáctica del italiano. Convierte el siguiente material de ejercicios en un array de ejercicios interactivos.
Llama a la herramienta save_exercises con todos los ejercicios generados.

IDIOMA DE LAS INSTRUCCIONES: ${langLabel}
(El contenido italiano se mantiene en italiano; instrucciones y etiquetas van en ${langLabel})

Tipos disponibles: fill_blank | choice | dialogue | free_write

Ejemplos mínimos de cada tipo:

fill_blank:
{"id":"ej1","type":"fill_blank","number":1,"title":"Completa","instruction":"Escribe la forma correcta.","items":[{"id":"q1","label":"Vado ___ scuola","answer":"alla","placeholder":"preposición..."}],"answerPanel":["Vado alla scuola"]}

choice (flat, una pregunta):
{"id":"ej2","type":"choice","number":2,"title":"Elige","instruction":"Selecciona la opción correcta.","multiSelect":false,"options":[{"value":"alla","correct":true},{"value":"del","correct":false}],"answerPanel":["alla"]}

choice (sub-preguntas):
{"id":"ej3","type":"choice","number":3,"title":"Formal o informal","instruction":"Elige para cada saludo.","multiSelect":false,"questions":[{"id":"q1","text":"Ciao","options":[{"value":"Informal","correct":true},{"value":"Formal","correct":false}]}],"answerPanel":["Ciao → Informal"]}

dialogue:
{"id":"ej4","type":"dialogue","number":4,"title":"Completa el diálogo","instruction":"Usa las palabras del recuadro.","wordBank":["ciao","stai"],"lines":[{"speaker":"Lucia","text":"___d1___ Alberto!"},{"speaker":"Alberto","text":"Come ___d2___?"}],"answers":{"d1":"ciao","d2":"stai"},"answerPanel":["Lucia: Ciao Alberto!","Alberto: Come stai?"]}

free_write:
{"id":"ej5","type":"free_write","number":5,"title":"Preséntate","instruction":"Completa con tu información.","fields":[{"id":"f1","prefix":"Mi chiamo","placeholder":"tu nombre..."}]}

Reglas:
- Convierte TODOS los ejercicios del material, sin omitir ninguno.
- No inventes contenido nuevo; usa el material exactamente como está.
- "answer" en fill_blank: minúsculas, sin tildes.
- Para dialogue usa ___id___ como placeholders.
- Agrega "section" solo al primer ejercicio de cada grupo temático (ej: "section": "Preposiciones articuladas").
- IMPORTANTE: Si no puedes determinar el tipo exacto, usa fill_blank. NUNCA devuelvas un array vacío — si el material tiene al menos una pregunta o ítem, genera al menos un ejercicio.`
}

/** Extract the first JSON array from a text string (for fallback parsing) */
function extractJsonArray(text: string): unknown[] | null {
  const start = text.indexOf('[')
  if (start === -1) return null
  const end = text.lastIndexOf(']')
  if (end === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(text.slice(start, end + 1))
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const EXERCISES_TOOL: Anthropic.Tool = {
  name: 'save_exercises',
  description: 'Save the generated exercises array.',
  input_schema: {
    type: 'object' as const,
    properties: {
      exercises: {
        type: 'array',
        description: 'Array of interactive exercises converted from the source material.',
        items: {
          type: 'object' as const,
          additionalProperties: true,
          properties: {
            id:          { type: 'string', description: 'Unique exercise id, e.g. "ej1"' },
            type:        { type: 'string', enum: ['fill_blank', 'choice', 'dialogue', 'free_write'] },
            number:      { type: 'number' },
            title:       { type: 'string' },
            instruction: { type: 'string' },
            section:     { type: 'string', description: 'Optional section heading shown above this exercise' },
            answerPanel: { type: 'array', items: { type: 'string' } },
            // fill_blank items
            items: {
              type: 'array',
              items: {
                type: 'object' as const,
                additionalProperties: true,
                properties: {
                  id:          { type: 'string' },
                  label:       { type: 'string' },
                  answer:      { type: 'string' },
                  placeholder: { type: 'string' },
                },
              },
            },
            // choice – flat single-question
            multiSelect: { type: 'boolean' },
            options: {
              type: 'array',
              items: {
                type: 'object' as const,
                additionalProperties: true,
                properties: {
                  value:   { type: 'string' },
                  correct: { type: 'boolean' },
                },
              },
            },
            // choice – grouped sub-questions
            questions: {
              type: 'array',
              items: {
                type: 'object' as const,
                additionalProperties: true,
                properties: {
                  id:   { type: 'string' },
                  text: { type: 'string' },
                  options: {
                    type: 'array',
                    items: {
                      type: 'object' as const,
                      additionalProperties: true,
                      properties: {
                        value:   { type: 'string' },
                        correct: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
            // dialogue
            wordBank: { type: 'array', items: { type: 'string' } },
            lines: {
              type: 'array',
              items: {
                type: 'object' as const,
                additionalProperties: true,
                properties: {
                  speaker: { type: 'string' },
                  text:    { type: 'string' },
                },
              },
            },
            answers: {
              type: 'object' as const,
              additionalProperties: { type: 'string' },
            },
            // free_write
            fields: {
              type: 'array',
              items: {
                type: 'object' as const,
                additionalProperties: true,
                properties: {
                  id:          { type: 'string' },
                  prefix:      { type: 'string' },
                  placeholder: { type: 'string' },
                },
              },
            },
          },
          required: ['id', 'type', 'number', 'title', 'instruction'],
        },
      },
    },
    required: ['exercises'],
  },
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })
  }

  // Step 1: parse FormData
  let formData: FormData
  try {
    formData = await req.formData()
    console.log('[import-exercises] FormData parsed OK')
  } catch (e) {
    console.error('[import-exercises] FormData parse error:', e)
    return NextResponse.json({ error: 'Error al leer el archivo' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const language = (formData.get('language') as string) || 'es'

  if (!file || file.size === 0) {
    console.error('[import-exercises] No file or empty file. file=', file?.name, 'size=', file?.size)
    return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
  }

  console.log(`[import-exercises] file="${file.name}" size=${file.size} type="${file.type}" lang=${language}`)

  const fileName = file.name.toLowerCase()
  const mimeType = file.type

  // Step 2: extract text from file
  let contentText: string

  if (mimeType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    contentText = await file.text()
    console.log(`[import-exercises] TXT extracted: ${contentText.length} chars`)
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    // Step 2a: read arrayBuffer before dynamic import to detect truncation early
    let arrayBuffer: ArrayBuffer
    try {
      arrayBuffer = await file.arrayBuffer()
      console.log(`[import-exercises] arrayBuffer read: ${arrayBuffer.byteLength} bytes`)
    } catch (e) {
      console.error('[import-exercises] arrayBuffer read error:', e)
      return NextResponse.json({ error: 'Error al leer el buffer del archivo' }, { status: 400 })
    }

    // Sanity check: a valid DOCX (ZIP) starts with PK\x03\x04
    const magic = Buffer.from(arrayBuffer.slice(0, 4))
    if (magic[0] !== 0x50 || magic[1] !== 0x4B) {
      console.error(`[import-exercises] Buffer does not look like a ZIP/DOCX. First 4 bytes: ${magic.toString('hex')}. Likely truncated by proxy (proxyClientMaxBodySize too low).`)
      return NextResponse.json({
        error: 'El archivo DOCX parece estar corrupto o fue truncado. Intenta de nuevo.',
      }, { status: 400 })
    }

    // Step 2b: parse with mammoth
    try {
      const mammoth = await import('mammoth')
      const buffer = Buffer.from(arrayBuffer)
      console.log(`[import-exercises] mammoth imported, converting buffer of ${buffer.length} bytes`)

      const { value: htmlContent, messages: mammothMsgs } = await mammoth.convertToHtml({ buffer })
      if (mammothMsgs.length > 0) {
        console.warn('[import-exercises] mammoth warnings:', mammothMsgs.map(m => m.message).join('; '))
      }

      if (htmlContent.trim()) {
        contentText = htmlToText(htmlContent)
        console.log(`[import-exercises] DOCX→HTML→text: ${contentText.length} chars`)
      } else {
        // Fallback: direct raw text extraction
        console.warn('[import-exercises] convertToHtml returned empty, falling back to extractRawText')
        const { value: rawText } = await mammoth.extractRawText({ buffer })
        contentText = rawText
        console.log(`[import-exercises] DOCX rawText: ${contentText.length} chars`)
      }

      console.log(`[import-exercises] DOCX preview: ${contentText.slice(0, 200).replace(/\n/g, '↵')}`)
    } catch (e) {
      console.error('[import-exercises] mammoth error:', e)
      return NextResponse.json({ error: 'No se pudo leer el archivo .docx' }, { status: 400 })
    }
  } else if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return NextResponse.json({
      error: 'PDF no soportado. Exporta el archivo como TXT o DOCX.',
    }, { status: 400 })
  } else {
    return NextResponse.json({ error: 'Formato no soportado. Usa TXT o DOCX.' }, { status: 400 })
  }

  if (!contentText.trim()) {
    console.error('[import-exercises] contentText empty after extraction')
    return NextResponse.json({ error: 'El archivo está vacío o no se pudo leer su contenido.' }, { status: 400 })
  }

  // Step 3: call Claude with tool_use (same pattern as translate-exercises which works)
  try {
    const client = new Anthropic({ apiKey })
    const prompt = buildPrompt(language)

    // Truncate content to avoid slow responses — 12K chars covers any realistic exercise file
    const trimmedContent = contentText.length > 12000
      ? contentText.slice(0, 12000) + '\n\n[contenido truncado]'
      : contentText

    // Step 3a: log what Claude sees (first 300 chars)
    console.log(`[import-exercises] Claude input preview (300): ${trimmedContent.slice(0, 300).replace(/\n/g, '↵')}`)
    console.log(`[import-exercises] calling Claude haiku tool_use, content ${trimmedContent.length} chars`)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      tools: [EXERCISES_TOOL],
      tool_choice: { type: 'tool', name: 'save_exercises' },
      messages: [{
        role: 'user',
        content: `${prompt}\n\nCONTENIDO:\n${trimmedContent}`,
      }],
    })

    console.log(`[import-exercises] Claude response: stop_reason=${message.stop_reason} content_blocks=${message.content.length}`)

    // Step 4: extract tool_use block (guaranteed by tool_choice: forced)
    const toolBlock = message.content.find(b => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      console.error('[import-exercises] No tool_use block. Full content:', JSON.stringify(message.content))
      return NextResponse.json({ error: 'Error al generar ejercicios. Intenta de nuevo.' }, { status: 502 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = toolBlock.input as any
    let exercises: Exercise[] = Array.isArray(raw.exercises) ? raw.exercises : []

    console.log(`[import-exercises] tool_use generated ${exercises.length} exercises | stop_reason=${message.stop_reason}`)

    // Step 5: fallback — if tool_use returned empty array, retry without tool_use
    if (!exercises.length) {
      console.warn('[import-exercises] tool_use returned empty — attempting plain-text fallback')
      const fallbackMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        system: 'You extract exercises from Italian lesson material and return ONLY a JSON array. No explanations.',
        messages: [{
          role: 'user',
          content: `Extract exercises from this content as a JSON array. Use type "fill_blank" for any question with a blank answer. Return ONLY the JSON array.\n\n${trimmedContent}`,
        }],
      })

      const fallbackText = fallbackMsg.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('')

      console.log(`[import-exercises] fallback raw (200): ${fallbackText.slice(0, 200).replace(/\n/g, '↵')}`)

      const parsed = extractJsonArray(fallbackText)
      if (parsed && parsed.length > 0) {
        exercises = parsed as Exercise[]
        console.log(`[import-exercises] fallback produced ${exercises.length} exercises`)
      } else {
        console.error('[import-exercises] fallback also returned empty. content preview:', contentText.slice(0, 500).replace(/\n/g, '↵'))
        return NextResponse.json({
          error: 'No se generaron ejercicios. Verifica que el archivo contenga ejercicios con preguntas y respuestas definidas.',
        }, { status: 422 })
      }
    }

    return NextResponse.json({ exercises })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/lessons/import-exercises]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
