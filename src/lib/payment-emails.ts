import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Italianto <noreply@italianto.com>'
const BASE_URL = 'https://italianto.com'

const LOGO = `<div style="text-align:center;margin-bottom:24px">
  <img src="${BASE_URL}/logo_Italianto.png" alt="Italianto" width="48" height="48"
       style="border-radius:12px;margin-bottom:8px;display:inline-block">
  <div style="color:#81c784;font-size:16px;font-weight:800;letter-spacing:0.02em">Italianto</div>
</div>`

const FOOTER = `
<div style="margin-top:28px;padding-top:20px;border-top:1px solid #1a3a1a;text-align:center">
  <p style="color:#2e7d32;font-size:11px;margin:0;line-height:1.7">
    © ${new Date().getFullYear()} Italianto · <a href="${BASE_URL}" style="color:#388e3c">italianto.com</a>
    <br>Stai ricevendo questa email perché ti sei registrato su Italianto.
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
    ${FOOTER}
  </div>
</body>
</html>`
}

const PLAN_LABELS: Record<string, string> = {
  essenziale: 'Essenziale',
  avanzato: 'Avanzato',
  maestro: 'Maestro',
}

function planLabel(planType: string) {
  return PLAN_LABELS[planType] ?? planType
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn('[payment-emails] RESEND_API_KEY not configured — email not sent:', subject)
    return
  }
  await resend.emails.send({ from: FROM, to, subject, html })
}

// ── Cobro Stripe fallido: avisar al cliente para que actualice su tarjeta ────

export async function sendPaymentFailedEmail(opts: {
  to: string
  name: string | null
  planType: string
  isRenewal: boolean
}) {
  const name = opts.name?.split(' ')[0] || 'studente'
  const subject = `${name}, c'è un problema con il tuo pagamento ⚠️`
  const html = wrap(`
    <h1 style="color:#e8f5e9;font-size:20px;margin:0 0 16px">Ciao ${name},</h1>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0 0 12px">
      ${opts.isRenewal
        ? `Non siamo riusciti a rinnovare il tuo abbonamento <strong>${planLabel(opts.planType)}</strong>.`
        : `Il pagamento del tuo abbonamento <strong>${planLabel(opts.planType)}</strong> non è andato a buon fine.`}
    </p>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0">
      Controlla che la tua carta sia valida e abbia fondi sufficienti. Stripe riproverà
      automaticamente nei prossimi giorni — puoi anche aggiornare il metodo di pagamento
      dal tuo profilo.
    </p>
    ${cta('Aggiorna il metodo di pagamento', `${BASE_URL}/dashboard`)}
  `)
  await send(opts.to, subject, html)
}

// ── Pago manual: recibido, aprobado, rechazado ───────────────────────────────

export async function sendManualPaymentReceivedEmail(opts: {
  to: string
  name: string | null
  planType: string
  method: string
  reference: string
}) {
  const name = opts.name?.split(' ')[0] || 'studente'
  const methodLabel = opts.method === 'pago_movil' ? 'Pago Móvil' : 'Zelle'
  const subject = 'Abbiamo ricevuto il tuo pagamento — in verifica ⏳'
  const html = wrap(`
    <h1 style="color:#e8f5e9;font-size:20px;margin:0 0 16px">Ciao ${name},</h1>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0 0 12px">
      Abbiamo registrato il tuo pagamento via <strong>${methodLabel}</strong>
      (riferimento <strong>${opts.reference}</strong>) per il piano
      <strong>${planLabel(opts.planType)}</strong>.
    </p>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0">
      Lo verificheremo entro 24 ore e riceverai una conferma via email quando il tuo
      piano sarà attivo. Grazie per la pazienza! 🙌
    </p>
  `)
  await send(opts.to, subject, html)
}

export async function sendManualPaymentApprovedEmail(opts: {
  to: string
  name: string | null
  planType: string
  periodEnd: string // ISO
}) {
  const name = opts.name?.split(' ')[0] || 'studente'
  const until = new Date(opts.periodEnd).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const subject = `Il tuo piano ${planLabel(opts.planType)} è attivo! 🎉`
  const html = wrap(`
    <h1 style="color:#e8f5e9;font-size:20px;margin:0 0 16px">Ciao ${name},</h1>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0 0 12px">
      Il tuo pagamento è stato verificato e il piano
      <strong>${planLabel(opts.planType)}</strong> è già attivo sul tuo account,
      valido fino al <strong>${until}</strong>.
    </p>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0">
      Buono studio! 🇮🇹
    </p>
    ${cta('Vai alla piattaforma', `${BASE_URL}/dashboard`)}
  `)
  await send(opts.to, subject, html)
}

export async function sendManualPaymentRejectedEmail(opts: {
  to: string
  name: string | null
  planType: string
  adminNote: string | null
}) {
  const name = opts.name?.split(' ')[0] || 'studente'
  const subject = 'Non siamo riusciti a verificare il tuo pagamento ⚠️'
  const html = wrap(`
    <h1 style="color:#e8f5e9;font-size:20px;margin:0 0 16px">Ciao ${name},</h1>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0 0 12px">
      Non siamo riusciti a verificare il pagamento che hai segnalato per il piano
      <strong>${planLabel(opts.planType)}</strong>.
      ${opts.adminNote ? `<br><br>Motivo: <em>${opts.adminNote}</em>` : ''}
    </p>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0">
      Controlla il numero di riferimento e riprova, oppure scrivici rispondendo a
      questa email e ti aiuteremo subito.
    </p>
    ${cta('Riprova', `${BASE_URL}/precios`)}
  `)
  await send(opts.to, subject, html)
}

// ── Renovación manual: recordatorio antes del vencimiento ────────────────────

export async function sendManualRenewalReminderEmail(opts: {
  to: string
  name: string | null
  planType: string
  periodEnd: string // ISO
}) {
  const name = opts.name?.split(' ')[0] || 'studente'
  const until = new Date(opts.periodEnd).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const subject = `${name}, il tuo piano ${planLabel(opts.planType)} scade presto ⏰`
  const html = wrap(`
    <h1 style="color:#e8f5e9;font-size:20px;margin:0 0 16px">Ciao ${name},</h1>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0 0 12px">
      Il tuo piano <strong>${planLabel(opts.planType)}</strong> scade il
      <strong>${until}</strong>. Per continuare senza interruzioni, rinnova con
      Pago Móvil, Zelle o carta dalla pagina dei prezzi.
    </p>
    ${cta('Rinnova ora', `${BASE_URL}/precios`)}
  `)
  await send(opts.to, subject, html)
}
