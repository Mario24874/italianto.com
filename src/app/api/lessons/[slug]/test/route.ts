import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { TestQuestion } from '@/types'

export const dynamic = 'force-dynamic'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { slug } = await params
    const supabase = getSupabaseAdmin()

    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('title, level, content_html, vocabulary, grammar_notes')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !lesson) {
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })
    }

    const vocabText = Array.isArray(lesson.vocabulary)
      ? lesson.vocabulary.map((v: { word: string; translation: string; example?: string }) =>
          `${v.word} = ${v.translation}${v.example ? ` (ej: ${v.example})` : ''}`
        ).join('\n')
      : ''

    const prompt = `Sei un insegnante di italiano. In base al seguente contenuto di lezione, genera 10 domande a scelta multipla in italiano per testare la comprensione dello studente.

Ogni domanda deve avere esattamente 4 opzioni (A, B, C, D) con una sola risposta corretta. Le domande devono essere appropriate per il livello ${lesson.level}.

Rispondi SOLO con JSON valido con questa struttura esatta:
{
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "answer": "A",
      "explanation": "Breve spiegazione in italiano"
    }
  ]
}

TITOLO LEZIONE: ${lesson.title}
LIVELLO: ${lesson.level}

CONTENUTO:
${stripHtml(lesson.content_html)}

VOCABOLARIO:
${vocabText}

NOTE DI GRAMMATICA:
${lesson.grammar_notes}

Genera domande che testino: comprensione del vocabolario, regole grammaticali, comprensione della lettura e traduzioni. Varia i tipi di domande.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Gemini API error]', response.status, errText)
      return NextResponse.json({ error: 'Error al generar preguntas' }, { status: 502 })
    }

    const geminiData = await response.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let parsed: { questions: TestQuestion[] }
    try {
      parsed = JSON.parse(rawText)
    } catch {
      console.error('[Gemini JSON parse error]', rawText.slice(0, 500))
      return NextResponse.json({ error: 'Formato de respuesta inválido' }, { status: 502 })
    }

    if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) {
      return NextResponse.json({ error: 'No se generaron preguntas' }, { status: 502 })
    }

    return NextResponse.json({ questions: parsed.questions.slice(0, 10) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/lessons/:slug/test]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
