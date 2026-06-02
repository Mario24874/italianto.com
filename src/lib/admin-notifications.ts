import { Resend } from 'resend'
import { getSupabaseAdmin } from './supabase'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Italianto <noreply@italianto.com>'
const NOTIFY_EMAIL = 'italiantonline@gmail.com'

interface AdminEvent {
  type: string
  severity?: 'info' | 'warning' | 'critical'
  title: string
  message: string
  metadata?: Record<string, unknown>
  emailSubject: string
  emailRows: [string, string][]
}

export async function notifyAdmin(event: AdminEvent): Promise<void> {
  const { type, severity = 'info', title, message, metadata = {}, emailSubject, emailRows } = event

  // Insert system notification (fire-and-forget)
  const supabase = getSupabaseAdmin()
  supabase.from('system_notifications').insert({
    type,
    severity,
    title,
    message,
    source: 'webhook',
    metadata,
  }).then(({ error }) => {
    if (error) console.error('[admin-notif] system_notifications error:', error.message)
  })

  if (!resend) {
    console.warn('[admin-notif] RESEND_API_KEY not set — email skipped')
    return
  }

  const now = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
  const rowsHtml = emailRows.map(([label, value]) =>
    `<tr>
      <td style="color:#4caf50;padding:5px 12px 5px 0;width:110px;vertical-align:top;font-size:12px">${label}</td>
      <td style="color:#e8f5e9;padding:5px 0;font-size:13px;font-weight:600">${value}</td>
    </tr>`
  ).join('')

  await resend.emails.send({
    from: FROM,
    to: NOTIFY_EMAIL,
    subject: emailSubject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0f0a;color:#e8f5e9;font-family:system-ui,sans-serif;margin:0;padding:0">
  <div style="max-width:460px;margin:0 auto;padding:28px 16px">
    <div style="text-align:center;margin-bottom:18px">
      <img src="https://italianto.com/logo_Italianto.png" alt="Italianto" width="40" height="40" style="border-radius:10px;margin-bottom:8px">
      <h1 style="color:#81c784;font-size:16px;margin:0;font-weight:700">Italianto Admin</h1>
    </div>
    <div style="background:#132213;border:1px solid #1e3a1e;border-radius:16px;padding:22px">
      <h2 style="color:#e8f5e9;font-size:15px;font-weight:700;margin:0 0 16px">${title}</h2>
      <table style="width:100%;border-collapse:collapse">${rowsHtml}</table>
    </div>
    <div style="text-align:center;margin-top:16px">
      <a href="https://italianto.com/admin/notificaciones"
         style="display:inline-block;background:#1b3a1b;border:1px solid #2e7d32;color:#81c784;
                text-decoration:none;border-radius:10px;padding:10px 20px;font-size:12px;font-weight:600">
        Ver panel admin →
      </a>
    </div>
    <p style="color:#2e7d32;text-align:center;font-size:10px;margin-top:14px">
      © ${now.split(',')[0].split('/').reverse().join('-')} Italianto · Notificación automática
    </p>
  </div>
</body>
</html>`,
  }).catch(err => console.error('[admin-notif] email error:', err))
}
