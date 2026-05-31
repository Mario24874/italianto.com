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

  return `Eres un experto en didáctica del italiano. Analiza el siguiente material de ejercicios y genera ejercicios interactivos estructurados en formato JSON.

IDIOMA DE LAS INSTRUCCIONES: ${langLabel}
(El contenido italiano se mantiene en italiano; las instrucciones, etiquetas y explicaciones van en ${langLabel})

Tipos de ejercicio disponibles:

1. fill_blank — rellena el espacio en blanco con texto libre
2. choice — elige entre opciones (único o múltiple)
3. dialogue — completa un diálogo
4. free_write — escritura libre, sin corrección automática

Esquema exacto:

[
  {
    "id": "ej1",
    "type": "fill_blank",
    "number": 1,
    "section": "🔤 El Alfabeto",
    "title": "¿Cómo se llama cada letra?",
    "instruction": "Escribe el nombre en italiano de cada letra.",
    "items": [
      { "id": "q1", "label": "La letra H", "answer": "acca", "placeholder": "nombre en italiano..." }
    ],
    "answerPanel": ["H → acca", "G → gi"]
  },
  {
    "id": "ej2",
    "type": "choice",
    "number": 2,
    "section": "🔊 Pronunciación",
    "title": "Selecciona las letras extranjeras",
    "instruction": "Selecciona TODAS las letras consideradas extranjeras en italiano.",
    "multiSelect": true,
    "options": [
      { "value": "J", "correct": true },
      { "value": "A", "correct": false }
    ],
    "answerPanel": ["J (i lunga), K (cappa), W (vu doppia), X (ics), Y (ipsilon)"]
  },
  {
    "id": "ej3",
    "type": "choice",
    "number": 3,
    "title": "¿Formal o informal?",
    "instruction": "Para cada saludo, elige si es formal, informal o ambos.",
    "multiSelect": false,
    "questions": [
      {
        "id": "q1",
        "text": "\\"Ciao!\\"",
        "options": [
          { "value": "Informal", "correct": true },
          { "value": "Formal", "correct": false },
          { "value": "Ambos", "correct": false }
        ]
      }
    ],
    "answerPanel": ["\\"Ciao!\\" → Informal"]
  },
  {
    "id": "ej4",
    "type": "dialogue",
    "number": 4,
    "title": "Completa el diálogo",
    "instruction": "Completa el diálogo con las palabras del recuadro: ciao, stai, sto, grazie, bene",
    "wordBank": ["ciao", "stai", "sto", "grazie", "bene"],
    "lines": [
      { "speaker": "Lucia", "text": "___d1___ Alberto!" },
      { "speaker": "Alberto", "text": "Ciao Lucia, come ___d2___?" }
    ],
    "answers": { "d1": "ciao", "d2": "stai" },
    "answerPanel": ["Lucia: Ciao Alberto!", "Alberto: Ciao Lucia, come stai?"]
  },
  {
    "id": "ej5",
    "type": "free_write",
    "number": 5,
    "title": "Preséntate en italiano",
    "instruction": "Completa las frases con tu información personal.",
    "fields": [
      { "id": "f1", "prefix": "Mi chiamo", "placeholder": "tu nombre..." },
      { "id": "f2", "prefix": "Sono di", "placeholder": "tu ciudad de origen..." }
    ]
  }
]

Reglas:
- El contenido puede venir como texto plano, HTML o formato mixto — interpreta la estructura e intención de cada ejercicio independientemente del formato de entrada.
- Si el archivo ya tiene ejercicios definidos (con preguntas, respuestas, instrucciones), conviértelos directamente al esquema JSON sin inventar contenido nuevo.
- Genera tantos ejercicios como haya en el material (sin límite mínimo — si hay 1, devuelve 1; si hay 20, devuelve 20).
- Agrupa temáticamente con "section" (emoji + título) cuando haya varios temas. Solo el primer ejercicio de cada sección lleva "section".
- "answer" en fill_blank: respuesta normalizada (sin tildes, minúsculas).
- Para dialogue, usa ___id___ como placeholders en "text".
- Llama a la herramienta save_exercises con el array completo.`
}

const EXERCISES_TOOL: Anthropic.Tool = {
  name: 'save_exercises',
  description: 'Save the generated exercises array.',
  input_schema: {
    type: 'object' as const,
    properties: {
      exercises: {
        type: 'array',
        description: 'Array of Exercise objects following the schema provided.',
        items: { type: 'object' as const },
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
      model: 'claude-sonnet-4-5',
      max_tokens: 10000,
      tools: [EXERCISES_TOOL],
      tool_choice: { type: 'tool', name: 'save_exercises' },
      messages: [{
        role: 'user',
        content: `${prompt}\n\nCONTENIDO:\n${contentText}`,
      }],
    })

    const toolBlock = message.content.find(b => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json({ error: 'Error al generar ejercicios. Intenta de nuevo.' }, { status: 502 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = toolBlock.input as any
    const exercises: Exercise[] = Array.isArray(raw.exercises) ? raw.exercises : []

    console.log(`[import-exercises] generated ${exercises.length} exercises | stop_reason=${message.stop_reason} | input_keys=${Object.keys(raw).join(',')}`)
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
