import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  // Require an active paid subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_type, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .neq('plan_type', 'free')
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({ error: 'Si requiere un plan de pago para usar el Tutor AI' }, { status: 403 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Servizio AI non configurato' }, { status: 500 })
  }

  let body: { messages: Message[]; tutorName?: string; tutorSlug?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 })
  }

  const { messages, tutorName, tutorSlug } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages è obbligatorio' }, { status: 400 })
  }

  // Fetch specific tutor from tutors table if slug provided
  let resolvedName = tutorName || 'Marco'
  if (tutorSlug) {
    const { data: tutor } = await supabase
      .from('tutors')
      .select('name')
      .eq('slug', tutorSlug)
      .eq('is_active', true)
      .maybeSingle()
    if (tutor?.name) resolvedName = tutor.name
  }

  // Fetch global config (knowledge base, system prompt)
  const { data: tutorConfig } = await supabase
    .from('tutor_config')
    .select('knowledge_base, system_prompt_template')
    .eq('id', 'default')
    .maybeSingle()

  const knowledgeBase = tutorConfig?.knowledge_base?.trim() ?? ''
  const customTemplate = tutorConfig?.system_prompt_template?.trim() ?? ''

  const systemPrompt = customTemplate || `Sei ${resolvedName}, un tutor di italiano amichevole e paziente. Il tuo compito è aiutare l'utente a praticare l'italiano parlato.

Regole fondamentali:
- Parla SEMPRE in italiano, anche se l'utente ti scrive in un'altra lingua
- Correggi gli errori grammaticali con gentilezza: ripeti la frase corretta e spiega brevemente l'errore
- Adatta il livello di difficoltà in base alla capacità dimostrata dall'utente
- Fai domande aperte per mantenere la conversazione fluente
- Mantieni le risposte brevi (2-3 frasi max) per un ritmo naturale
- Ogni 4-5 scambi, dai un breve incoraggiamento sui progressi dell'utente
- Non usare emoji o simboli speciali nelle risposte — solo testo parlato

Se l'utente è principiante (A1-A2), puoi dare brevi spiegazioni in spagnolo o inglese solo quando strettamente necessario, poi torna subito all'italiano.${knowledgeBase ? `\n\nBASE DI CONOSCENZA:\n${knowledgeBase}` : ''}`

  // Convert messages to Gemini content format
  const contents = messages.map((m: Message) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  try {
    // CAMBIO: Usamos v1 y verificamos el nombre del modelo
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 200,
          },
        }),
      }
    )

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[Gemini tutor chat error]', response.status, JSON.stringify(errData, null, 2));
      
      // Si es un error de cuota (429), avisa específicamente
      if (response.status === 429) {
        return NextResponse.json({ error: 'Limite di quota raggiunto. Riprova tra un momento.' }, { status: 429 });
      }
      
      return NextResponse.json({ error: 'Errore del servizio AI' }, { status: 502 })
    }
  }