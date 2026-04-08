import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DEFAULT_VOICE_ID = 'b8jhBTcGAq4kQGWmKprT'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_type, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .neq('plan_type', 'free')
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({ error: 'Piano a pagamento richiesto' }, { status: 403 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS non configurato' }, { status: 500 })
  }

  let body: { text: string; voice_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 })
  }

  const { text, voice_id } = body
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text è obbligatorio' }, { status: 400 })
  }

  // Resolve voice: body → tutor_config → default
  let voiceId = voice_id
  if (!voiceId) {
    const { data: config } = await supabase
      .from('tutor_config')
      .select('elevenlabs_voice_id')
      .eq('id', 'default')
      .maybeSingle()
    voiceId = config?.elevenlabs_voice_id || DEFAULT_VOICE_ID
  }

  try {
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )

    if (!ttsRes.ok) {
      const errText = await ttsRes.text()
      console.error('[ElevenLabs TTS error]', ttsRes.status, errText)
      return NextResponse.json({ error: 'Errore TTS' }, { status: 502 })
    }

    const audioBuffer = await ttsRes.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/tutor/tts]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
