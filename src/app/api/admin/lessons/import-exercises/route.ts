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

  return `Eres un experto en didáctica del italiano. Convierte el siguiente material de ejercicios en un JSON array de ejercicios interactivos.

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
- Devuelve ÚNICAMENTE el JSON array, sin markdown, sin explicaciones, sin texto adicional.`
}

/** Extract a JSON array from a text response that may include markdown fences */
function extractJsonArray(text: string): unknown[] {
  // Try fenced code block first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1].trim() : text.trim()

  // Find the outermost [ ... ] block
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON array found in response')
  }

  return JSON.parse(candidate.slice(start, end + 1)) as unknown[]
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Error al leer el archivo' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const language = (formData.get('language') as string) || 'es'

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
  }

  const fileName = file.name.toLowerCase()
  const mimeType = file.type

  let contentText: string

  if (mimeType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    contentText = await file.text()
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    try {
      const mammoth = await import('mammoth')
      const buffer = Buffer.from(await file.arrayBuffer())
      // Convert to HTML first (preserves structure), then strip tags to clean text
      const { value: htmlContent } = await mammoth.convertToHtml({ buffer })
      if (htmlContent.trim()) {
        contentText = htmlToText(htmlContent)
      } else {
        // Fallback: direct raw text extraction
        const { value: rawText } = await mammoth.extractRawText({ buffer })
        contentText = rawText
      }
      console.log(`[import-exercises] DOCX extracted: ${contentText.length} chars (preview: ${contentText.slice(0, 200).replace(/\n/g, '↵')})`)
    } catch (e) {
      console.error('[DOCX parse error]', e)
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
    return NextResponse.json({ error: 'El archivo está vacío o no se pudo leer su contenido.' }, { status: 400 })
  }

  try {
    const client = new Anthropic({ apiKey })
    const prompt = buildPrompt(language)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: `${prompt}\n\nCONTENIDO:\n${contentText}`,
      }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text' || !textBlock.text.trim()) {
      console.error('[import-exercises] No text block in response. stop_reason=' + message.stop_reason)
      return NextResponse.json({ error: 'Error al generar ejercicios. Intenta de nuevo.' }, { status: 502 })
    }

    let exercises: Exercise[]
    try {
      const parsed = extractJsonArray(textBlock.text)
      exercises = parsed as Exercise[]
    } catch (parseErr) {
      const preview = textBlock.text.slice(0, 300).replace(/\n/g, '↵')
      console.error(`[import-exercises] JSON parse failed: ${parseErr instanceof Error ? parseErr.message : parseErr}. Response preview: ${preview}`)
      return NextResponse.json({
        error: 'La respuesta no contiene JSON válido. Intenta de nuevo.',
      }, { status: 502 })
    }

    console.log(`[import-exercises] generated ${exercises.length} exercises | stop_reason=${message.stop_reason}`)
    if (exercises.length === 0) {
      console.log(`[import-exercises] content preview: ${contentText.slice(0, 500).replace(/\n/g, '↵')}`)
    }

    if (!exercises.length) {
      return NextResponse.json({
        error: 'No se generaron ejercicios. Verifica que el archivo contenga ejercicios con preguntas y respuestas definidas.',
      }, { status: 422 })
    }

    return NextResponse.json({ exercises })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/lessons/import-exercises]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
