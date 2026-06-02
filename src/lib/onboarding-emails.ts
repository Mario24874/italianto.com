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
    ${unsubNote ? '<br>Stai ricevendo questa email perché ti sei registrato su Italianto.' : ''}
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
<html lang="it">
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
  const name = firstName || 'studente'
  return {
    subject: `Benvenuto su Italianto, ${name}! 🇮🇹`,
    html: wrap(`
      <div style="text-align:center;font-size:40px;margin-bottom:16px">🇮🇹</div>
      <h2 style="color:#e8f5e9;font-size:20px;font-weight:800;margin:0 0 8px;text-align:center">
        Benvenuto, ${name}!
      </h2>
      <p style="color:#a5d6a7;font-size:14px;margin:0 0 24px;text-align:center;line-height:1.6">
        Il tuo account Italianto è pronto. Ecco tutto quello che puoi usare da oggi:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
        ${[
          ['🤖', 'Tutor IA Personale', 'Conversa in italiano e ricevi correzioni in tempo reale'],
          ['📚', 'Lezioni A1→C2', 'Guide trilingui: italiano, spagnolo e inglese'],
          ['🎵', 'Canzoni', 'Impara il vocabolario cantando con testi sincronizzati'],
          ['🎮', 'Passatempi', 'Cruciverba e giochi per rafforzare ciò che hai imparato'],
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
          "In bocca al lupo!" — Buona fortuna nel tuo viaggio verso l'italiano!
        </span>
      </div>

      ${cta('Inizia ora →', `${BASE_URL}/lezioni`)}
    `),
  }
}

// ── Email 2: Tutor IA (Day 2) ───────────────────────────────────────────────

function email2(firstName: string) {
  const name = firstName || 'studente'
  return {
    subject: `${name}, hai già parlato italiano oggi? 🤖`,
    html: wrap(`
      <div style="text-align:center;font-size:44px;margin-bottom:16px">🤖</div>
      <h2 style="color:#e8f5e9;font-size:20px;font-weight:800;margin:0 0 12px;text-align:center">
        Il tuo Tutor IA personale ti aspetta
      </h2>
      <p style="color:#a5d6a7;font-size:14px;margin:0 0 20px;line-height:1.6">
        Il <strong style="color:#e8f5e9">Tutor IA</strong> di Italianto è ciò che ci distingue da qualsiasi
        altra app di lingue. Non ti insegna soltanto — <em>conversa con te</em>.
      </p>

      <div style="background:#0a1a0a;border-radius:14px;padding:18px;margin-bottom:16px">
        ${[
          ['🎙️', 'Parla in italiano', 'Conversa tramite voce o testo in qualsiasi momento'],
          ['✅', 'Correzione istantanea', 'Corregge errori di grammatica e pronuncia in tempo reale'],
          ['📈', 'Si adatta a te', 'Regola la difficoltà al tuo livello (A1→C2) automaticamente'],
          ['🔁', 'Pratica illimitata', 'Ripeti finché non ti senti sicuro, senza pressione'],
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
        Di' "Ciao!" e inizia la tua prima conversazione in italiano oggi.
      </p>

      ${cta('Parla con il Tutor IA →', `${BASE_URL}/tutor`)}
    `),
  }
}

// ── Email 3: Lecciones + Canzoni (Day 5) ────────────────────────────────────

function email3(firstName: string) {
  const name = firstName || 'studente'
  return {
    subject: `${name}, impara l'italiano con lezioni e canzoni 🎵`,
    html: wrap(`
      <h2 style="color:#e8f5e9;font-size:20px;font-weight:800;margin:0 0 12px;text-align:center">
        Due modi unici per imparare l'italiano
      </h2>
      <p style="color:#a5d6a7;font-size:14px;margin:0 0 24px;text-align:center;line-height:1.6">
        Combinali per imparare più velocemente e ricordare di più.
      </p>

      <div style="background:#0a1a0a;border-radius:14px;padding:20px;margin-bottom:12px">
        <div style="font-size:28px;margin-bottom:8px">📚</div>
        <div style="color:#e8f5e9;font-size:15px;font-weight:800;margin-bottom:6px">Lezioni A1 → C2</div>
        <p style="color:#a5d6a7;font-size:13px;margin:0 0 12px;line-height:1.5">
          Guide strutturate con grammatica, vocabolario ed esercizi.
          Ogni lezione è disponibile in <strong style="color:#e8f5e9">italiano, spagnolo e inglese</strong>.
        </p>
        <a href="${BASE_URL}/lezioni"
          style="display:inline-block;background:#1b3a1b;border:1px solid #2e7d32;color:#81c784;
                 text-decoration:none;border-radius:8px;padding:8px 18px;font-size:12px;font-weight:700">
          Vedi le lezioni →
        </a>
      </div>

      <div style="background:#0a1a0a;border-radius:14px;padding:20px;margin-bottom:20px">
        <div style="font-size:28px;margin-bottom:8px">🎵</div>
        <div style="color:#e8f5e9;font-size:15px;font-weight:800;margin-bottom:6px">Canzoni — Impara cantando</div>
        <p style="color:#a5d6a7;font-size:13px;margin:0 0 12px;line-height:1.5">
          Canzoni italiane reali con testi, traduzione e note di vocabolario.
          La musica fa sì che le parole rimangano nella tua memoria.
        </p>
        <a href="${BASE_URL}/canzoni"
          style="display:inline-block;background:#1b3a1b;border:1px solid #2e7d32;color:#81c784;
                 text-decoration:none;border-radius:8px;padding:8px 18px;font-size:12px;font-weight:700">
          Esplora le canzoni →
        </a>
      </div>

      <p style="color:#4caf50;font-size:12px;text-align:center;font-style:italic;margin:0">
        "Chi studia ogni giorno impara ogni giorno."
      </p>
    `),
  }
}

// ── Email 4: Upgrade (Day 8) ─────────────────────────────────────────────────

function email4(firstName: string) {
  const name = firstName || 'studente'
  return {
    subject: `${name}, porta il tuo italiano al livello successivo 🚀`,
    html: wrap(`
      <div style="text-align:center;font-size:40px;margin-bottom:16px">🚀</div>
      <h2 style="color:#e8f5e9;font-size:20px;font-weight:800;margin:0 0 12px;text-align:center">
        Pronto per il piano completo?
      </h2>
      <p style="color:#a5d6a7;font-size:14px;margin:0 0 20px;text-align:center;line-height:1.6">
        Con il piano <strong style="color:#e8f5e9">Maestro</strong> sblocchi tutto
        ciò di cui hai bisogno per parlare italiano con fluidità:
      </p>

      <div style="background:#0a1a0a;border-radius:14px;padding:18px;margin-bottom:20px">
        ${[
          ['♾️', 'Tutor IA senza limiti', 'Conversazioni illimitate, senza quota mensile'],
          ['📚', 'Tutte le lezioni A1→C2', 'Accesso completo a tutti i contenuti della piattaforma'],
          ['🎵', 'Canzoni premium', 'Catalogo completo di canzoni con analisi approfondita'],
          ['🎮', 'Tutte le attività', 'Cruciverba, giochi ed esercizi senza restrizioni'],
          ['🔔', 'Nuovo contenuto in anteprima', 'Accesso prioritario a tutto ciò che viene pubblicato'],
        ].map(([icon, title, desc]) => `
        <div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start">
          <span style="font-size:16px;min-width:22px">${icon}</span>
          <div>
            <span style="color:#e8f5e9;font-size:13px;font-weight:700">${title}</span>
            <span style="color:#66bb6a;font-size:12px"> — ${desc}</span>
          </div>
        </div>`).join('')}
      </div>

      ${cta('Vedi i piani e i prezzi →', `${BASE_URL}/precios`)}

      <p style="color:#4caf50;font-size:11px;text-align:center;margin-top:16px;margin-bottom:0">
        Nessun contratto. Cancella quando vuoi.
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
