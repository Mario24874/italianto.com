import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 })
  }

  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  switch (evt.type) {
    case 'user.created': {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data
      const email = email_addresses[0]?.email_address

      await supabase.from('users').insert({
        id,
        email: email || '',
        full_name: [first_name, last_name].filter(Boolean).join(' ') || null,
        avatar_url: image_url || null,
        plan_type: 'free',
      })

      // Crear registro de suscripción free
      await supabase.from('subscriptions').insert({
        id: `free_${id}`,
        user_id: id,
        status: 'free',
        plan_type: 'free',
        currency: 'usd',
        cancel_at_period_end: false,
        tutor_minutes_used: 0,
        dialogues_used: 0,
        audio_used: 0,
      })
      break
    }

    case 'user.updated': {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data
      const email = email_addresses[0]?.email_address

      await supabase
        .from('users')
        .update({
          email: email || '',
          full_name: [first_name, last_name].filter(Boolean).join(' ') || null,
          avatar_url: image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      break
    }

    case 'user.deleted': {
      const { id } = evt.data
      if (id) {
        await supabase.from('users').delete().eq('id', id)
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ processed: true })
}
