const EMAILJS_SERVICE_ID  = process.env.EMAILJS_SERVICE_ID  ?? 'service_d8g3j1y'
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID ?? 'template_u0xw46i'
const EMAILJS_PUBLIC_KEY  = process.env.EMAILJS_PUBLIC_KEY  ?? 'NscgD18J-QbRDqmhv'
const ADMIN_EMAIL         = process.env.ADMIN_EMAIL         ?? 'italiantonline@gmail.com'

/**
 * Send an email via EmailJS REST API (server-safe, no browser dependency).
 */
async function sendViaEmailJS(templateParams: Record<string, string>): Promise<void> {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:      EMAILJS_SERVICE_ID,
      template_id:     EMAILJS_TEMPLATE_ID,
      user_id:         EMAILJS_PUBLIC_KEY,
      template_params: templateParams,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.status.toString())
    throw new Error(`EmailJS error ${res.status}: ${text}`)
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
  const { userName, userEmail, sessionTitle, sessionType, dayName, startTime, durationMin } = opts

  await sendViaEmailJS({
    user_name:  'Sistema Italianto',
    user_email: ADMIN_EMAIL,
    reply_to:   userEmail,
    message: [
      `Nuevo horario programado`,
      ``,
      `Usuario: ${userName} (${userEmail})`,
      `Sesión:  ${sessionTitle} (${sessionType})`,
      `Día:     ${dayName} a las ${startTime}`,
      `Duración: ${durationMin} min`,
    ].join('\n'),
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
  const { to, userName, sessionTitle, sessionType, dayName, startTime, reminderMinutes } = opts

  await sendViaEmailJS({
    user_name:  userName,
    user_email: to,
    reply_to:   ADMIN_EMAIL,
    message: [
      `Recordatorio de sesión de estudio`,
      ``,
      `Hola ${userName}, tu sesión comienza en ${reminderMinutes} minutos.`,
      ``,
      `Sesión:  ${sessionTitle} (${sessionType})`,
      `Día:     ${dayName} a las ${startTime}`,
      ``,
      `Ingresa en https://italianto.com/orario para ver tu horario.`,
    ].join('\n'),
  })
}
