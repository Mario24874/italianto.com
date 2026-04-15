import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.EMAIL_FROM ?? 'Italianto <noreply@italianto.com>'

export async function sendStudyReminder(opts: {
  to: string
  userName: string
  sessionTitle: string
  sessionType: string
  dayName: string
  startTime: string
  reminderMinutes: number
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping email reminder')
    return
  }

  const { to, userName, sessionTitle, sessionType, dayName, startTime, reminderMinutes } = opts

  const typeEmoji: Record<string, string> = {
    grammatica: '📖', vocabolario: '📝', ascolto: '🎧',
    parlare: '🗣️', lettura: '📚', scrittura: '✍️',
    tutor: '🤖', altro: '📅'
  }
  const emoji = typeEmoji[sessionType] ?? '📅'

  await resend.emails.send({
    from: FROM,
    to,
    subject: `⏰ Recordatorio: ${sessionTitle} en ${reminderMinutes} min`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0f0a;color:#e8f5e9;font-family:system-ui,sans-serif;margin:0;padding:0">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:28px">
      <img src="https://italianto.com/logo_Italianto.png" alt="Italianto" width="56" height="56"
           style="border-radius:12px;margin-bottom:12px">
      <h1 style="color:#81c784;font-size:20px;margin:0">Italianto</h1>
    </div>
    <div style="background:#132213;border:1px solid #1e3a1e;border-radius:16px;padding:28px">
      <div style="font-size:40px;text-align:center;margin-bottom:12px">${emoji}</div>
      <h2 style="color:#e8f5e9;font-size:18px;font-weight:700;text-align:center;margin:0 0 8px">
        ¡Tu sesión de estudio comienza pronto!
      </h2>
      <p style="color:#81c784;text-align:center;font-size:14px;margin:0 0 24px">
        Hola ${userName}, tienes una sesión programada en <strong>${reminderMinutes} minutos</strong>.
      </p>
      <div style="background:#0a1a0a;border-radius:12px;padding:20px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#4caf50;font-size:12px;font-weight:600;text-transform:uppercase">Sesión</span>
        </div>
        <div style="color:#e8f5e9;font-size:16px;font-weight:700;margin-bottom:4px">${sessionTitle}</div>
        <div style="color:#66bb6a;font-size:13px">${dayName} · ${startTime}</div>
      </div>
      <a href="https://italianto.com/orario"
         style="display:block;background:#2e7d32;color:#fff;text-decoration:none;border-radius:12px;
                padding:14px;text-align:center;font-weight:700;font-size:15px">
        Ver mi horario →
      </a>
    </div>
    <p style="color:#2e7d32;text-align:center;font-size:11px;margin-top:20px">
      © ${new Date().getFullYear()} Italianto ·
      <a href="https://italianto.com/impostazioni" style="color:#388e3c">Gestionar notificaciones</a>
    </p>
  </div>
</body>
</html>`,
  })
}
