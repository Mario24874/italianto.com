import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import type { Exercise } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function buildPrompt(language: string): string {
  const langLabel = language === 'en' ? 'English' : language === 'it' ? 'italiano' : 'español'

  return `Eres un experto en didáctica del italiano. Analiza el siguiente material de ejercicios y genera ejercicios interactivos estructurados en formato JSON.

IDIOMA DE LAS INSTRUCCIONES: ${langLabel}
(El contenido italiano se mantiene en italiano; las instrucciones, etiquetas y explicaciones van en ${langLabel})

Devuelve SOLO un JSON válido: un array de objetos Exercise. Sin markdown, sin texto adicional.

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
        "text": "\"Ciao!\"",
        "options": [
          { "value": "Informal", "correct": true },
          { "value": "Formal", "correct": false },
          { "value": "Ambos", "correct": false }
        ]
      }
    ],
    "answerPanel": ["\"Ciao!\" → Informal"]
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
- Genera tantos ejercicios como contenga el material (mínimo 3, máximo 10)
- Agrupa temáticamente con "section" (emoji + título) cuando haya varios temas
- Solo la primera ejercicio de cada sección lleva "section"; los demás del mismo tema no
- "answer" en fill_blank debe ser la respuesta normalizada (sin tildes, minúsculas)
- Para dialogue, usa ___id___ como placeholders dentro de "text"
- Devuelve SOLO el array JSON, nada más`
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })
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
  const PROMPT = buildPrompt(language)

  let contents: object[]

  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    const base64 = arrayBufferToBase64(await file.arrayBuffer())
    contents = [{
      parts: [
        { inline_data: { mime_type: 'application/pdf', data: base64 } },
        { text: PROMPT },
      ],
    }]
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    try {
      const mammoth = await import('mammoth')
      const buffer = Buffer.from(await file.arrayBuffer())
      const { value: rawText } = await mammoth.extractRawText({ buffer })
      if (!rawText.trim()) {
        return NextResponse.json({ error: 'El documento .docx está vacío' }, { status: 400 })
      }
      contents = [{ parts: [{ text: `${PROMPT}\n\nCONTENIDO:\n${rawText}` }] }]
    } catch (e) {
      console.error('[DOCX parse error]', e)
      return NextResponse.json({ error: 'No se pudo leer el archivo .docx' }, { status: 400 })
    }
  } else if (mimeType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    const text = await file.text()
    if (!text.trim()) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    }
    contents = [{ parts: [{ text: `${PROMPT}\n\nCONTENIDO:\n${text}` }] }]
  } else {
    return NextResponse.json({ error: 'Formato no soportado. Usa PDF, DOCX o TXT.' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Gemini exercises error]', response.status, errText)
      return NextResponse.json({ error: 'Error al procesar con IA' }, { status: 502 })
    }

    const geminiData = await response.json()
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let exercises: Exercise[]
    try {
      const parsed = JSON.parse(rawText)
      exercises = Array.isArray(parsed) ? parsed : parsed.exercises ?? []
    } catch {
      console.error('[Gemini exercises JSON parse error]', rawText.slice(0, 300))
      return NextResponse.json({ error: 'No se pudo estructurar los ejercicios. Intenta con otro archivo.' }, { status: 502 })
    }

    if (!exercises.length) {
      return NextResponse.json({ error: 'El archivo no contiene suficiente contenido para generar ejercicios' }, { status: 422 })
    }

    return NextResponse.json({ exercises })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/lessons/import-exercises]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
