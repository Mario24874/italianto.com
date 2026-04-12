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

const GEMINI_PROMPT = `Eres un experto en didáctica del italiano y diseño pedagógico. Analiza el siguiente contenido educativo y genera una lección visualmente rica y moderna en HTML.

Devuelve SOLO un JSON válido con esta estructura exacta (sin markdown, sin \`\`\`, solo el JSON puro):
{
  "title": "Título descriptivo de la lección en italiano",
  "level": "A1",
  "content_html": "...HTML RICO AQUÍ...",
  "grammar_notes": "Resumen gramatical en texto plano...",
  "vocabulary": [
    {"word": "parola italiana", "translation": "traducción al español", "example": "Frase de ejemplo en italiano."}
  ]
}

═══════════════════════════════════════════════════
REGLAS PARA content_html — LEE CON ATENCIÓN
═══════════════════════════════════════════════════

ETIQUETAS PERMITIDAS: h2, h3, h4, p, strong, em, ul, ol, li, blockquote, table, thead, tbody, tr, th, td, hr, span

1. SECCIONES — Cada sección temática debe tener un h2 con emoji:
   <h2>🔤 L'Alfabeto Italiano</h2>
   <h2>🔊 Pronunciazione</h2>
   <h2>📅 Mesi e Giorni</h2>
   <h2>👋 I Saluti</h2>
   <h2>🙋 Le Presentazioni</h2>
   <h2>📖 Gli Articoli</h2>
   Usa el emoji más apropiado según el tema.

2. TABLAS — Usa SIEMPRE tablas HTML para datos tabulares (alfabetos, meses, saludos, artículos, conjugaciones):
   <table>
     <thead><tr><th>Letra</th><th>Nombre</th><th>Ejemplo</th></tr></thead>
     <tbody>
       <tr><td>A</td><td>a</td><td>amico</td></tr>
       <tr><td>B</td><td>bi</td><td>bello</td></tr>
     </tbody>
   </table>
   NO uses listas para datos que son claramente tablas.

3. CAJAS DE CONSEJO (📌) — Usa blockquote con class="tip":
   <blockquote class="tip">Las letras J, K, W, X, Y se usan en palabras de origen extranjero.</blockquote>

4. CAJAS DE NOTA IMPORTANTE (ℹ️) — Usa blockquote con class="info":
   <blockquote class="info">En italiano no se dice "Sono di + país". Se dice: Sono italiano/a.</blockquote>

5. CAJAS DE DIÁLOGO (💬) — Usa blockquote con class="dialogo":
   <blockquote class="dialogo">
     <p><strong>Lucia:</strong> Ciao Alberto!</p>
     <p><strong>Alberto:</strong> Ciao Lucia, come stai?</p>
     <p><strong>Lucia:</strong> Sto bene, grazie, e tu?</p>
   </blockquote>

6. SEPARADORES — Usa <hr> entre secciones principales.

7. TEXTO — No uses listas para información que se lee mejor como prosa. Usa <p> para explicaciones.

8. PLANTILLAS — Si hay plantillas de presentación (Io mi chiamo ___), ponlas en blockquote class="info".

═══════════════════════════════════════════════════
REGLAS GENERALES
═══════════════════════════════════════════════════
- "level": uno de: A1, A2, B1, B2, C1, C2
- "grammar_notes": texto plano con las reglas gramaticales principales
- "vocabulary": extrae TODAS las palabras clave con traducción y ejemplo. Mínimo 5, máximo 30
- Si el documento está en varios idiomas: el contenido italiano va en italiano, las explicaciones en el idioma de la guía
- Responde SOLO el JSON, absolutamente nada más`

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
    try {
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      // Convert Web API ArrayBuffer to Node.js Buffer for mammoth compatibility
      const buffer = Buffer.from(arrayBuffer)
      const { value: rawText } = await mammoth.extractRawText({ buffer })

      if (!rawText.trim()) {
        return NextResponse.json({ error: 'El documento .docx está vacío o no se pudo leer' }, { status: 400 })
      }

      contents = [{
        parts: [{ text: `${GEMINI_PROMPT}\n\nCONTENIDO DEL DOCUMENTO:\n${rawText}` }],
      }]
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[DOCX parse error]', msg)
      return NextResponse.json({ error: 'No se pudo leer el archivo .docx. Verifica que no esté dañado.' }, { status: 400 })
    }
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
