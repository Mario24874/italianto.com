import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { path, message, stack, user_id, severity = 'error', metadata = {} } = body

    if (!message) return NextResponse.json({ ok: false }, { status: 400 })

    const supabase = getSupabaseAdmin()
    await supabase.from('error_logs').insert({ path, message, stack, user_id, severity, metadata })

    // Email alert for critical errors
    if (severity === 'critical') {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      if (serviceId && templateId && publicKey) {
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
              to_email: 'italiantonline@gmail.com',
              subject: `[CRÍTICO] Error en Italianto — ${path ?? 'unknown'}`,
              message: `Error: ${message}\n\nRuta: ${path}\n\nStack:\n${stack ?? 'N/A'}`,
              reply_to: 'italiantonline@gmail.com',
              user_name: 'Sistema Italianto',
            },
          }),
        }).catch(() => null)
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
