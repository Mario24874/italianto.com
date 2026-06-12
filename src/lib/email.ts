import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Must be a domain verified in Resend — NOT a Gmail address.
// italianto.com domain is verified; fallback to the noreply alias.
const FROM = 'Italianto <noreply@italianto.com>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'info@italianto.com'
const SEGMENT_ID = process.env.RESEND_SEGMENT_ID ?? ''

function noResend(fn: string) {
  console.warn(`[email] RESEND_API_KEY not set — skipping ${fn}`)
}

export async function addContactToAudience(email: string, firstName: string): Promise<void> {
  if (!resend) return
  await resend.contacts.create({
    email,
    firstName,
    unsubscribed: false,
    ...(SEGMENT_ID ? { segments: [{ id: SEGMENT_ID }] } : {}),
  })
}

export async function removeContactFromAudience(email: string): Promise<void> {
  if (!resend) return
  await resend.contacts.remove({ email })
}

export async function getAudienceContactCount(): Promise<number> {
  if (!resend) return 0
  const result = await resend.contacts.list(SEGMENT_ID ? { segmentId: SEGMENT_ID } : undefined)
  if (result.error || !result.data) return 0
  return result.data.data.filter(c => !c.unsubscribed).length
}

export async function sendNewsletter(opts: {
  subject: string
  html: string
  previewText?: string
  name?: string
}): Promise<{ broadcastId: string }> {
  if (!resend) throw new Error('RESEND_API_KEY not configured')
  if (!SEGMENT_ID) throw new Error('RESEND_SEGMENT_ID not configured')

  const createResult = await resend.broadcasts.create({
    segmentId: SEGMENT_ID,
    from: FROM,
    subject: opts.subject,
    html: opts.html,
    // Resend rejects broadcast names longer than 70 chars (422 validation_error)
    name: (opts.name ?? opts.subject).slice(0, 70),
    ...(opts.previewText ? { previewText: opts.previewText } : {}),
  })
  if (createResult.error) throw new Error(JSON.stringify(createResult.error))
  const broadcastId = createResult.data!.id

  const sendResult = await resend.broadcasts.send(broadcastId)
  if (sendResult.error) throw new Error(JSON.stringify(sendResult.error))
  return { broadcastId }
}

export async function listBroadcasts() {
  if (!resend) return []
  const result = await resend.broadcasts.list()
  if (result.error || !result.data) return []
  return result.data.data
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  crucigrama: 'Cruciverba',
  wordsearch: 'Trova le parole',
  matching: 'Abbinamento',
  fillblank: 'Completa la frase',
  flashcards: 'Flashcard',
}

export async function sendContentNotification(opts: {
  title: string
  type?: string
  level?: string
  contentType: string
  url: string
}): Promise<void> {
  if (!resend) { noResend('sendContentNotification'); return }

  const typeLabel = opts.type ? (ACTIVITY_TYPE_LABELS[opts.type] ?? opts.type) : opts.contentType
  const subject = `Nuovo contenuto su Italianto: ${opts.title}`
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
      <p style="color:#a5d6a7;font-size:14px;margin:0 0 16px">
        Ciao! Abbiamo aggiunto nuovi contenuti per te sulla piattaforma.
      </p>
      <div style="background:#0a1a0a;border-radius:12px;padding:16px;margin-bottom:20px">
        <div style="color:#e8f5e9;font-weight:700;font-size:16px;margin-bottom:4px">${opts.title}</div>
        <div style="color:#66bb6a;font-size:12px">${typeLabel}${opts.level ? ` · Livello ${opts.level}` : ''}</div>
      </div>
      <a href="${opts.url}" style="display:block;background:#2e7d32;color:#fff;text-decoration:none;border-radius:12px;padding:14px;text-align:center;font-weight:700;font-size:15px">
        Vai alla piattaforma →
      </a>
    </div>
    <p style="color:#2e7d32;text-align:center;font-size:11px;margin-top:20px">
      © ${new Date().getFullYear()} Italianto
    </p>
  </div>
</body>
</html>`

  // Always notify admin directly — independent of broadcast/segment config
  const adminResult = await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[Admin] Contenuto pubblicato: ${opts.title}`,
    html,
  })
  if (adminResult.error) {
    console.error('[email] Admin notification failed:', adminResult.error)
  } else {
    console.log('[email] Admin notified:', adminResult.data?.id)
  }

  // Also broadcast to subscribers if segment is configured
  if (SEGMENT_ID) {
    sendNewsletter({ subject, html, name: `Contenuto: ${opts.title}` })
      .catch(err => console.error('[email] Broadcast failed:', err))
  }
}

/**
 * Notify admin when a user creates a study schedule session.
 */
export async function sendScheduleCreatedNotification(opts: {
  userName: string
  userEmail: string
  sessionTitle: string
  sessionType: string
  dayName: string
  startTime: string
  durationMin: number
}): Promise<void> {
  if (!resend) { noResend('sendScheduleCreatedNotification'); return }

  const { userName, userEmail, sessionTitle, sessionType, dayName, startTime, durationMin } = opts

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: userEmail,
    subject: `📅 Nuevo horario programado — ${sessionTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0f0a;color:#e8f5e9;font-family:system-ui,sans-serif;margin:0;padding:0">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:24px">
      <img src="https://italianto.com/logo_Italianto.png" alt="Italianto" width="48" height="48"
           style="border-radius:12px;margin-bottom:10px">
      <h1 style="color:#81c784;font-size:18px;margin:0">Italianto — Nuevo Horario</h1>
    </div>
    <div style="background:#132213;border:1px solid #1e3a1e;border-radius:16px;padding:24px">
      <h2 style="color:#e8f5e9;font-size:16px;font-weight:700;margin:0 0 16px">
        📅 ${userName} programó una sesión de estudio
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr><td style="color:#4caf50;padding:4px 0;width:100px">Sesión</td><td style="color:#e8f5e9">${sessionTitle}</td></tr>
        <tr><td style="color:#4caf50;padding:4px 0">Tipo</td><td style="color:#e8f5e9">${sessionType}</td></tr>
        <tr><td style="color:#4caf50;padding:4px 0">Día/Hora</td><td style="color:#e8f5e9">${dayName} a las ${startTime}</td></tr>
        <tr><td style="color:#4caf50;padding:4px 0">Duración</td><td style="color:#e8f5e9">${durationMin} min</td></tr>
        <tr><td style="color:#4caf50;padding:4px 0">Email</td><td style="color:#e8f5e9">${userEmail}</td></tr>
      </table>
    </div>
    <p style="color:#2e7d32;text-align:center;font-size:11px;margin-top:20px">
      © ${new Date().getFullYear()} Italianto
    </p>
  </div>
</body>
</html>`,
  })
}

/**
 * Send study session reminder to a user.
 */
export async function sendStudyReminder(opts: {
  to: string
  userName: string
  sessionTitle: string
  sessionType: string
  dayName: string
  startTime: string
  reminderMinutes: number
}): Promise<void> {
  if (!resend) { noResend('sendStudyReminder'); return }

  const { to, userName, sessionTitle, sessionType, dayName, startTime, reminderMinutes } = opts

  const typeEmoji: Record<string, string> = {
    grammatica: '📖', vocabolario: '📝', ascolto: '🎧',
    parlare: '🗣️', lettura: '📚', scrittura: '✍️',
    tutor: '🤖', altro: '📅',
  }
  const emoji = typeEmoji[sessionType] ?? '📅'

  await resend.emails.send({
    from: FROM,
    to,
    subject: `⏰ Promemoria: ${sessionTitle} tra ${reminderMinutes} min`,
    html: `
<!DOCTYPE html>
<html lang="it">
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
        La tua sessione di studio inizia presto!
      </h2>
      <p style="color:#81c784;text-align:center;font-size:14px;margin:0 0 24px">
        Ciao ${userName}, hai una sessione programmata tra <strong>${reminderMinutes} minuti</strong>.
      </p>
      <div style="background:#0a1a0a;border-radius:12px;padding:20px;margin-bottom:20px">
        <div style="color:#e8f5e9;font-size:16px;font-weight:700;margin-bottom:4px">${sessionTitle}</div>
        <div style="color:#66bb6a;font-size:13px">${dayName} · ${startTime}</div>
      </div>
      <a href="https://italianto.com/orario"
         style="display:block;background:#2e7d32;color:#fff;text-decoration:none;border-radius:12px;
                padding:14px;text-align:center;font-weight:700;font-size:15px">
        Vedi il mio orario →
      </a>
    </div>
    <p style="color:#2e7d32;text-align:center;font-size:11px;margin-top:20px">
      © ${new Date().getFullYear()} Italianto ·
      <a href="https://italianto.com/impostazioni" style="color:#388e3c">Gestisci le notifiche</a>
    </p>
  </div>
</body>
</html>`,
  })
}
