import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Shared secret between italianto-master (EasyPanel env) and ItaliantoApp (eas.json)
const APP_TOKEN = process.env.ITALIANTOAPP_TOKEN

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  // Verify app token
  const token = req.headers.get('x-app-token')
  if (!APP_TOKEN || token !== APP_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Servizio AI non configurato' }, { status: 500 })
  }

  let body: { email: string; messages: Message[]; tutorName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 })
  }

  const { email, messages, tutorName = 'Marco' } = body

  if (!email || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'email y messages son requeridos' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Look up subscription by email (bridge between ItaliantoApp Clerk and italianto.com)
  const { data: sub } = await supabase
    .rpc('get_subscription_by_email', { p_email: email })
    .single()

  if (!sub || sub.plan_type === 'free') {
    return NextResponse.json({ error: 'Se requiere un plan de pago para usar el Tutor AI' }, { status: 403 })
  }

  // Fetch knowledge base
  const { data: tutorConfig } = await supabase
    .from('tutor_config')
    .select('knowledge_base, system_prompt_template')
    .eq('id', 'default')
    .maybeSingle()

  const knowledgeBase = tutorConfig?.knowledge_base?.trim() ?? ''
  const customTemplate = tutorConfig?.system_prompt_template?.trim() ?? ''

  const systemPrompt = customTemplate || `Sei ${tutorName}, un tutor di italiano amichevole e paziente. Il tuo compito è aiutare l'utente a praticare l'italiano parlato.

Regole fondamentali:
- Parla SEMPRE in italiano, anche se l'utente ti scrive in un'altra lingua
- Correggi gli errori grammaticali con gentilezza: ripeti la frase corretta e spiega brevemente l'errore
- Adatta il livello di difficoltà in base alla capacità dimostrata dall'utente
- Fai domande aperte per mantenere la conversazione fluente
- Mantieni le risposte brevi (2-3 frasi max) per un ritmo naturale
- Non usare emoji o simboli speciali nelle risposte — solo testo parlato${knowledgeBase ? `\n\nBASE DI CONOSCENZA:\n${knowledgeBase}` : ''}`

  const contents = messages.map((m: Message) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.8, maxOutputTokens: 200 },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Gemini app/chat error]', response.status, errText)
      return NextResponse.json({ error: 'Errore del servizio AI' }, { status: 502 })
    }

    const data = await response.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!text) {
      return NextResponse.json({ error: 'Nessuna risposta dal tutor' }, { status: 502 })
    }

    // Track minutes used against the italianto.com user_id
    const italiantoUserId: string = sub.user_id
    const minutesAdd = messages.length > 1 ? 0.1 : 0 // track ~6s per exchange
    if (minutesAdd > 0) {
      await supabase.rpc('increment_quota', {
        p_user_id: italiantoUserId,
        p_column: 'tutor_minutes_used',
        p_amount: minutesAdd,
      }).catch(() => {})
    }

    return NextResponse.json({ text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/app/chat]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
