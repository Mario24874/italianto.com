import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// Allow up to 15 MB uploads
export const maxDuration = 60

interface ImportedLesson {
  title: string
  level: string
  content_html: string
  grammar_notes: string
  vocabulary: { word: string; translation: string; example?: string }[]
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

const GEMINI_PROMPT = `Eres un experto en didáctica del italiano. Analiza el siguiente contenido educativo y extrae toda la información relevante para crear una lección estructurada de italiano.

Devuelve SOLO un JSON válido con esta estructura exacta (sin markdown, sin código, solo el JSON):
{
  "title": "Título descriptivo de la lección en italiano",
  "level": "A1",
  "content_html": "<h2>...</h2><p>...</p>",
  "grammar_notes": "Notas de gramática en texto plano...",
  "vocabulary": [
    {"word": "parola italiana", "translation": "traducción al español", "example": "Frase de ejemplo en italiano."}
  ]
}

Reglas importantes:
- "level": debe ser uno de: A1, A2, B1, B2, C1, C2 (elige según la dificultad real del texto)
- "content_html": usa solo estas etiquetas HTML: h2, h3, p, strong, em, ul, ol, li, blockquote. El contenido debe ser la explicación pedagógica completa, bien organizada y clara
- "grammar_notes": texto plano con las reglas gramaticales principales. Si no hay notas explícitas, genera un resumen gramatical basado en el contenido
- "vocabulary": extrae TODAS las palabras y expresiones relevantes del contenido con su traducción al español y un ejemplo de uso. Mínimo 5 palabras, máximo 30
- Si el documento contiene texto en varios idiomas, la lección final debe estar en italiano (contenido) con traducciones al español (vocabulario)
- Responde SOLO con el JSON, sin ningún texto adicional`

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
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
  }

  const fileName = file.name.toLowerCase()
  const mimeType = file.type

  // ── Build Gemini request parts based on file type ─────────────────────────
  let contents: object[]

  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    // PDFs: send inline base64 — Gemini reads them natively
    const arrayBuffer = await file.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)

    contents = [{
      parts: [
        { inline_data: { mime_type: 'application/pdf', data: base64 } },
        { text: GEMINI_PROMPT },
      ],
    }]
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    // DOCX: extract raw text with mammoth, then send as plain text
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const { value: rawText } = await mammoth.extractRawText({ arrayBuffer })

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'El documento .docx está vacío o no se pudo leer' }, { status: 400 })
    }

    contents = [{
      parts: [{ text: `${GEMINI_PROMPT}\n\nCONTENIDO DEL DOCUMENTO:\n${rawText}` }],
    }]
  } else if (
    mimeType === 'text/plain' ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md')
  ) {
    const text = await file.text()
    if (!text.trim()) {
      return NextResponse.json({ error: 'El archivo de texto está vacío' }, { status: 400 })
    }

    contents = [{
      parts: [{ text: `${GEMINI_PROMPT}\n\nCONTENIDO:\n${text}` }],
    }]
  } else {
    return NextResponse.json({
      error: 'Formato no soportado. Usa PDF, DOCX o TXT.',
    }, { status: 400 })
  }

  // ── Call Gemini ───────────────────────────────────────────────────────────
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Gemini import error]', response.status, errText)
      return NextResponse.json({ error: 'Error al procesar el archivo con IA' }, { status: 502 })
    }

    const geminiData = await response.json()
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let parsed: ImportedLesson
    try {
      parsed = JSON.parse(rawText)
    } catch {
      console.error('[Gemini import JSON parse error]', rawText.slice(0, 300))
      return NextResponse.json({ error: 'No se pudo estructurar el contenido. Intenta con otro archivo.' }, { status: 502 })
    }

    // Validate minimal structure
    if (!parsed.title || !parsed.content_html) {
      return NextResponse.json({ error: 'El archivo no contiene suficiente contenido para generar una lección' }, { status: 422 })
    }

    return NextResponse.json({ lesson: parsed })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/lessons/import]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
