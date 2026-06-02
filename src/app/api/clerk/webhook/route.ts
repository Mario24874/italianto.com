import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { getSupabaseAdmin } from '@/lib/supabase'
import { addContactToAudience, removeContactFromAudience } from '@/lib/email'
import { notifyAdmin } from '@/lib/admin-notifications'
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

      if (email) {
        await addContactToAudience(email, first_name ?? '').catch(err =>
          console.warn('[clerk-webhook] addContactToAudience failed:', err)
        )
      }

      const fullName = [first_name, last_name].filter(Boolean).join(' ') || '(sin nombre)'
      const now = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
      notifyAdmin({
        type: 'new_user',
        title: 'Nuevo usuario gratuito',
        message: `${fullName} (${email ?? 'sin email'}) se registró`,
        metadata: { email, user_id: id, full_name: fullName },
        emailSubject: `[Italianto] Nuevo usuario — ${email ?? id}`,
        emailRows: [
          ['Nombre', fullName],
          ['Email', email ?? '(sin email)'],
          ['Plan', 'Gratuito'],
          ['Fecha', now],
        ],
      }).catch(err => console.warn('[clerk-webhook] notifyAdmin failed:', err))

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
        const { data: user } = await supabase.from('users').select('email').eq('id', id).maybeSingle()
        await supabase.from('users').delete().eq('id', id)
        if (user?.email) {
          await removeContactFromAudience(user.email).catch(err =>
            console.warn('[clerk-webhook] removeContactFromAudience failed:', err)
          )
        }
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ processed: true })
}
