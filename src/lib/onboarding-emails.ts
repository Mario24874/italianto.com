import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Italianto <noreply@italianto.com>'
const BASE_URL = 'https://italianto.com'

const LOGO = `<div style="text-align:center;margin-bottom:24px">
  <img src="${BASE_URL}/logo_Italianto.png" alt="Italianto" width="48" height="48"
       style="border-radius:12px;margin-bottom:8px;display:inline-block">
  <div style="color:#81c784;font-size:16px;font-weight:800;letter-spacing:0.02em">Italianto</div>
</div>`

const FOOTER = (unsubNote = true) => `
<div style="margin-top:28px;padding-top:20px;border-top:1px solid #1a3a1a;text-align:center">
  <p style="color:#2e7d32;font-size:11px;margin:0;line-height:1.7">
    © ${new Date().getFullYear()} Italianto · <a href="${BASE_URL}" style="color:#388e3c">italianto.com</a>
    ${unsubNote ? '<br>Estás recibiendo este email porque te registraste en Italianto.' : ''}
  </p>
</div>`

function cta(text: string, href: string) {
  return `<a href="${href}"
    style="display:block;background:linear-gradient(135deg,#2e7d32,#388e3c);color:#fff;
           text-decoration:none;border-radius:12px;padding:15px 24px;text-align:center;
           font-weight:800;font-size:15px;margin-top:24px;box-shadow:0 4px 16px rgba(46,125,50,0.35)">
    ${text}
  </a>`
}

function wrap(body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0f0a;color:#e8f5e9;font-family:system-ui,-apple-system,sans-serif;margin:0;padding:0">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    ${LOGO}
    <div style="background:#132213;border:1px solid #1e3a1e;border-radius:20px;padding:28px">
      ${body}
    </div>
    ${FOOTER()}
  </div>
</body>
</html>`
}

// ── Email 1: Bienvenida (Day 0) ─────────────────────────────────────────────

function email1(firstName: string) {
  const name = firstName || 'estudiante'
  return {
    subject: `Benvenuto a Italianto, ${name}! 🇮🇹`,
    html: wrap(`
      <div style="text-align:center;font-size:40px;margin-bottom:16px">🇮🇹</div>
      <h2 style="color:#e8f5e9;font-size:20px;font-weight:800;margin:0 0 8px;text-align:center">
        ¡Benvenuto, ${name}!
      </h2>
      <p style="color:#a5d6a7;font-size:14px;margin:0 0 24px;text-align:center;line-height:1.6">
        Tu cuenta en Italianto está lista. Aquí tienes todo lo que puedes usar desde hoy:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
        ${[
          ['🤖', 'Tutor IA Personal', 'Conversa en italiano y recibe correcciones en tiempo real'],
          ['📚', 'Lecciones A1→C2', 'Guías trilingües: italiano, español e inglés'],
          ['🎵', 'Canzoni', 'Aprende vocabulario cantando con letras sincronizadas'],
          ['🎮', 'Passatempi', 'Crucigramas y juegos para reforzar lo aprendido'],
        ].map(([icon, title, desc]) => `
        <tr>
          <td width="40" style="vertical-align:top;padding:0 10px 16px 0;font-size:24px">${icon}</td>
          <td style="padding-bottom:16px;border-bottom:1px solid #1a3a1a">
            <div style="color:#e8f5e9;font-size:14px;font-weight:700;margin-bottom:2px">${title}</div>
            <div style="color:#66bb6a;font-size:12px;line-height:1.4">${desc}</div>
          </td>
        </tr>`).join('')}
      </table>

      <div style="background:#0a1a0a;border-radius:12px;padding:14px;margin-top:8px;text-align:center">
        <span style="color:#4caf50;font-size:12px;font-style:italic">
          "In bocca al lupo!" — ¡Buena suerte en tu viaje al italiano!
        </span>
      </div>

      ${cta('Empezar ahora →', `${BASE_URL}/lezioni`)}
    `),
  }
}

// ── Email 2: Tutor IA (Day 2) ───────────────────────────────────────────────

function email2(firstName: string) {
  const name = firstName || 'estudiante'
  return {
    subject: `${name}, ¿ya hablaste italiano hoy? 🤖`,
    html: wrap(`
      <div style="text-align:center;font-size:44px;margin-bottom:16px">🤖</div>
      <h2 style="color:#e8f5e9;font-size:20px;font-weight:800;margin:0 0 12px;text-align:center">
        Tu Tutor IA personal te espera
      </h2>
      <p style="color:#a5d6a7;font-size:14px;margin:0 0 20px;line-height:1.6">
        El <strong style="color:#e8f5e9">Tutor IA</strong> de Italianto es lo que nos diferencia de cualquier
        otra app de idiomas. No solo te enseña — <em>conversa contigo</em>.
      </p>

      <div style="background:#0a1a0a;border-radius:14px;padding:18px;margin-bottom:16px">
        ${[
          ['🎙️', 'Habla en italiano', 'Conversa por voz o texto en cualquier momento'],
          ['✅', 'Corrección instantánea', 'Te corrige errores de gramática y pronunciación en tiempo real'],
          ['📈', 'Se adapta a ti', 'Ajusta la dificultad a tu nivel (A1→C2) automáticamente'],
          ['🔁', 'Práctica ilimitada', 'Repite hasta sentirte seguro, sin presión'],
        ].map(([icon, title, desc]) => `
        <div style="display:flex;gap:10px;margin-bottom:12px;align-items:flex-start">
          <span style="font-size:18px;min-width:24px">${icon}</span>
          <div>
            <div style="color:#e8f5e9;font-size:13px;font-weight:700">${title}</div>
            <div style="color:#66bb6a;font-size:12px">${desc}</div>
          </div>
        </div>`).join('')}
      </div>

      <p style="color:#66bb6a;font-size:13px;margin:0;text-align:center;font-style:italic">
        Di "Ciao!" y empieza tu primera conversación en italiano hoy.
      </p>

      ${cta('Hablar con el Tutor IA →', `${BASE_URL}/tutor`)}
    `),
  }
}

// ── Email 3: Lecciones + Canzoni (Day 5) ────────────────────────────────────

function email3(firstName: string) {
  const name = firstName || 'estudiante'
  return {
    subject: `Impara l'italiano — lecciones y canciones para ${name} 🎵`,
    html: wrap(`
      <h2 style="color:#e8f5e9;font-size:20px;font-weight:800;margin:0 0 12px;text-align:center">
        Dos formas únicas de aprender italiano
      </h2>
      <p style="color:#a5d6a7;font-size:14px;margin:0 0 24px;text-align:center;line-height:1.6">
        Combínalas para aprender más rápido y recordar más.
      </p>

      <div style="background:#0a1a0a;border-radius:14px;padding:20px;margin-bottom:12px">
        <div style="font-size:28px;margin-bottom:8px">📚</div>
        <div style="color:#e8f5e9;font-size:15px;font-weight:800;margin-bottom:6px">Lecciones A1 → C2</div>
        <p style="color:#a5d6a7;font-size:13px;margin:0 0 12px;line-height:1.5">
          Guías estructuradas con gramática, vocabulario y ejercicios.
          Cada lección está disponible en <strong style="color:#e8f5e9">italiano, español e inglés</strong>.
        </p>
        <a href="${BASE_URL}/lezioni"
          style="display:inline-block;background:#1b3a1b;border:1px solid #2e7d32;color:#81c784;
                 text-decoration:none;border-radius:8px;padding:8px 18px;font-size:12px;font-weight:700">
          Ver lecciones →
        </a>
      </div>

      <div style="background:#0a1a0a;border-radius:14px;padding:20px;margin-bottom:20px">
        <div style="font-size:28px;margin-bottom:8px">🎵</div>
        <div style="color:#e8f5e9;font-size:15px;font-weight:800;margin-bottom:6px">Canzoni — Aprende cantando</div>
        <p style="color:#a5d6a7;font-size:13px;margin:0 0 12px;line-height:1.5">
          Canciones italianas reales con letras, traducción y notas de vocabulario.
          La música hace que las palabras se queden en tu memoria.
        </p>
        <a href="${BASE_URL}/canzoni"
          style="display:inline-block;background:#1b3a1b;border:1px solid #2e7d32;color:#81c784;
                 text-decoration:none;border-radius:8px;padding:8px 18px;font-size:12px;font-weight:700">
          Explorar canciones →
        </a>
      </div>

      <p style="color:#4caf50;font-size:12px;text-align:center;font-style:italic;margin:0">
        "Chi studia ogni giorno impara ogni giorno." — Quien estudia cada día aprende cada día.
      </p>
    `),
  }
}

// ── Email 4: Upgrade (Day 8) ─────────────────────────────────────────────────

function email4(firstName: string) {
  const name = firstName || 'estudiante'
  return {
    subject: `${name}, lleva tu italiano al siguiente nivel 🚀`,
    html: wrap(`
      <div style="text-align:center;font-size:40px;margin-bottom:16px">🚀</div>
      <h2 style="color:#e8f5e9;font-size:20px;font-weight:800;margin:0 0 12px;text-align:center">
        ¿Listo para el plan completo?
      </h2>
      <p style="color:#a5d6a7;font-size:14px;margin:0 0 20px;text-align:center;line-height:1.6">
        Con el plan <strong style="color:#e8f5e9">Maestro</strong> desbloqueas todo
        lo que necesitas para hablar italiano con fluidez:
      </p>

      <div style="background:#0a1a0a;border-radius:14px;padding:18px;margin-bottom:20px">
        ${[
          ['♾️', 'Tutor IA sin límites', 'Conversaciones ilimitadas, sin cuota mensual'],
          ['📚', 'Todas las lecciones A1→C2', 'Acceso completo a todo el contenido de la plataforma'],
          ['🎵', 'Canzoni premium', 'Catálogo completo de canciones con análisis profundo'],
          ['🎮', 'Todas las actividades', 'Crucigramas, juegos y ejercicios sin restricción'],
          ['🔔', 'Nuevo contenido primero', 'Acceso prioritario a todo lo que se publique'],
        ].map(([icon, title, desc]) => `
        <div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start">
          <span style="font-size:16px;min-width:22px">${icon}</span>
          <div>
            <span style="color:#e8f5e9;font-size:13px;font-weight:700">${title}</span>
            <span style="color:#66bb6a;font-size:12px"> — ${desc}</span>
          </div>
        </div>`).join('')}
      </div>

      ${cta('Ver planes y precios →', `${BASE_URL}/precios`)}

      <p style="color:#4caf50;font-size:11px;text-align:center;margin-top:16px;margin-bottom:0">
        Sin contratos. Cancela cuando quieras.
      </p>
    `),
  }
}

// ── Scheduler ────────────────────────────────────────────────────────────────

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

export async function sendOnboardingSequence(email: string, firstName: string): Promise<void> {
  if (!resend) {
    console.warn('[onboarding] RESEND_API_KEY not set — skipping sequence')
    return
  }

  const name = (firstName ?? '').trim()

  const emails = [
    { ...email1(name), scheduledAt: undefined },             // Day 0 — immediate
    { ...email2(name), scheduledAt: daysFromNow(2) },        // Day 2
    { ...email3(name), scheduledAt: daysFromNow(5) },        // Day 5
    { ...email4(name), scheduledAt: daysFromNow(8) },        // Day 8
  ]

  const results = await Promise.allSettled(
    emails.map(({ subject, html, scheduledAt }) =>
      resend!.emails.send({
        from: FROM,
        to: email,
        subject,
        html,
        ...(scheduledAt ? { scheduledAt } : {}),
      })
    )
  )

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[onboarding] email ${i + 1} failed:`, r.reason)
    } else if (r.value.error) {
      console.error(`[onboarding] email ${i + 1} Resend error:`, r.value.error)
    } else {
      console.log(`[onboarding] email ${i + 1} scheduled:`, r.value.data?.id)
    }
  })
}
