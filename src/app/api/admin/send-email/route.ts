import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { to?: string; subject?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { to, subject, message } = body
  if (!to || !subject || !message) {
    return NextResponse.json({ error: 'to, subject and message are required' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY!)

  const escapedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0f0a;color:#e8f5e9;font-family:system-ui,sans-serif;margin:0;padding:0">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:24px">
      <img src="https://italianto.com/logo_Italianto.png" alt="Italianto" width="48" height="48" style="border-radius:12px;margin-bottom:8px">
      <h1 style="color:#81c784;font-size:18px;margin:0">Italianto</h1>
    </div>
    <div style="background:#132213;border:1px solid #1e3a1e;border-radius:16px;padding:24px">
      <p style="color:#e8f5e9;font-size:14px;line-height:1.7;margin:0">${escapedMessage}</p>
    </div>
    <p style="color:#2e7d32;text-align:center;font-size:11px;margin-top:20px">
      © ${new Date().getFullYear()} Italianto
    </p>
  </div>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: 'Italianto <noreply@italianto.com>',
    to,
    subject,
    html,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
