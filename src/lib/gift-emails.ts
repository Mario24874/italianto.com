import { Resend } from 'resend'
import { GIFT_PLAN_LABELS } from '@/lib/gift-cards'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Italianto <noreply@italianto.com>'
const BASE_URL = 'https://italianto.com'

type GiftLang = 'es' | 'it' | 'en'

const T = {
  es: {
    giftSubject: (name: string) => `🎁 ${name}, ¡te regalaron Italianto!`,
    receiptSubject: 'Tu Gift Card de Italianto está lista 🎁',
    giftTitle: '¡Tienes un regalo!',
    giftIntro: (buyer: string, plan: string, months: string) =>
      `<strong>${buyer}</strong> te regaló <strong>${months}</strong> del plan <strong>${plan}</strong> en Italianto, la plataforma para aprender italiano con inteligencia artificial.`,
    receiptTitle: '¡Gracias por tu compra!',
    receiptIntro: (plan: string, months: string) =>
      `Tu Gift Card de <strong>${months}</strong> del plan <strong>${plan}</strong> está activa.`,
    receiptSent: (email: string) => `También la enviamos a <strong>${email}</strong> como pediste.`,
    receiptKeep: 'Guarda este correo: el código de abajo es la tarjeta.',
    codeLabel: 'Código secreto de regalo',
    howTitle: '¿Cómo canjearla?',
    how1: 'Entra en italianto.com/regalo',
    how2: 'Crea tu cuenta gratis (o inicia sesión)',
    how3: 'Introduce el código y ¡a aprender italiano!',
    validUntil: (date: string) => `Válida hasta el ${date}.`,
    cta: 'Canjear mi regalo',
    monthsLabel: (m: number) => (m === 1 ? '1 mes' : m === 12 ? '1 año' : `${m} meses`),
    messageLabel: 'Mensaje para ti:',
  },
  it: {
    giftSubject: (name: string) => `🎁 ${name}, ti hanno regalato Italianto!`,
    receiptSubject: 'La tua Gift Card di Italianto è pronta 🎁',
    giftTitle: 'Hai un regalo!',
    giftIntro: (buyer: string, plan: string, months: string) =>
      `<strong>${buyer}</strong> ti ha regalato <strong>${months}</strong> del piano <strong>${plan}</strong> su Italianto, la piattaforma per imparare l'italiano con l'intelligenza artificiale.`,
    receiptTitle: 'Grazie per il tuo acquisto!',
    receiptIntro: (plan: string, months: string) =>
      `La tua Gift Card di <strong>${months}</strong> del piano <strong>${plan}</strong> è attiva.`,
    receiptSent: (email: string) => `L'abbiamo inviata anche a <strong>${email}</strong> come richiesto.`,
    receiptKeep: 'Conserva questa email: il codice qui sotto è la carta regalo.',
    codeLabel: 'Codice segreto del regalo',
    howTitle: 'Come riscattarla?',
    how1: 'Vai su italianto.com/regalo',
    how2: 'Crea il tuo account gratuito (o accedi)',
    how3: "Inserisci il codice e... a imparare l'italiano!",
    validUntil: (date: string) => `Valida fino al ${date}.`,
    cta: 'Riscatta il mio regalo',
    monthsLabel: (m: number) => (m === 1 ? '1 mese' : m === 12 ? '1 anno' : `${m} mesi`),
    messageLabel: 'Messaggio per te:',
  },
  en: {
    giftSubject: (name: string) => `🎁 ${name}, someone gifted you Italianto!`,
    receiptSubject: 'Your Italianto Gift Card is ready 🎁',
    giftTitle: 'You have a gift!',
    giftIntro: (buyer: string, plan: string, months: string) =>
      `<strong>${buyer}</strong> gifted you <strong>${months}</strong> of the <strong>${plan}</strong> plan on Italianto, the platform to learn Italian with artificial intelligence.`,
    receiptTitle: 'Thank you for your purchase!',
    receiptIntro: (plan: string, months: string) =>
      `Your Gift Card for <strong>${months}</strong> of the <strong>${plan}</strong> plan is active.`,
    receiptSent: (email: string) => `We also sent it to <strong>${email}</strong> as requested.`,
    receiptKeep: 'Keep this email: the code below is the gift card.',
    codeLabel: 'Secret gift code',
    howTitle: 'How to redeem it?',
    how1: 'Go to italianto.com/regalo',
    how2: 'Create your free account (or sign in)',
    how3: 'Enter the code and start learning Italian!',
    validUntil: (date: string) => `Valid until ${date}.`,
    cta: 'Redeem my gift',
    monthsLabel: (m: number) => (m === 1 ? '1 month' : m === 12 ? '1 year' : `${m} months`),
    messageLabel: 'A message for you:',
  },
} as const

const DATE_LOCALE: Record<GiftLang, string> = { es: 'es-ES', it: 'it-IT', en: 'en-US' }

/** La tarjeta dibujada en HTML de email (sin imágenes externas, solo gradientes) */
function giftCardVisual(code: string, planLabel: string, monthsLabel: string) {
  return `
<div style="margin:24px 0;border-radius:20px;overflow:hidden;border:1px solid #2e7d32;
            background:linear-gradient(135deg,#0d1f0e 0%,#143018 45%,#0d1f0e 100%)">
  <div style="height:6px;background:linear-gradient(90deg,#009246 33%,#f8fdf8 33%,#f8fdf8 66%,#ce2b37 66%)"></div>
  <div style="padding:26px 24px 22px">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="color:#81c784;font-size:13px;font-weight:800;letter-spacing:0.18em">ITALIANTO</td>
      <td align="right" style="color:#c8e6c9;font-size:11px;letter-spacing:0.14em">GIFT&nbsp;CARD</td>
    </tr></table>
    <div style="margin:22px 0 6px;color:#e8f5e9;font-size:22px;font-weight:800">
      ${planLabel} · ${monthsLabel}
    </div>
    <div style="display:inline-block;margin-top:14px;background:#060d07;border:1px dashed #4caf50;
                border-radius:12px;padding:12px 18px">
      <span style="color:#a5d6a7;font-family:ui-monospace,Menlo,monospace;font-size:18px;
                   font-weight:700;letter-spacing:0.12em">${code}</span>
    </div>
  </div>
  <div style="height:6px;background:linear-gradient(90deg,#009246 33%,#f8fdf8 33%,#f8fdf8 66%,#ce2b37 66%)"></div>
</div>`
}

function wrap(body: string, lang: GiftLang) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0f0a;color:#e8f5e9;font-family:system-ui,-apple-system,sans-serif;margin:0;padding:0">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:24px">
      <img src="${BASE_URL}/logo_Italianto.png" alt="Italianto" width="48" height="48"
           style="border-radius:12px;margin-bottom:8px;display:inline-block">
      <div style="color:#81c784;font-size:16px;font-weight:800;letter-spacing:0.02em">Italianto</div>
    </div>
    <div style="background:#132213;border:1px solid #1e3a1e;border-radius:20px;padding:28px">
      ${body}
    </div>
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #1a3a1a;text-align:center">
      <p style="color:#2e7d32;font-size:11px;margin:0;line-height:1.7">
        © ${new Date().getFullYear()} Italianto · <a href="${BASE_URL}" style="color:#388e3c">italianto.com</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

function cta(text: string) {
  return `<a href="${BASE_URL}/regalo"
    style="display:block;background:linear-gradient(135deg,#2e7d32,#388e3c);color:#fff;
           text-decoration:none;border-radius:12px;padding:15px 24px;text-align:center;
           font-weight:800;font-size:15px;margin-top:24px;box-shadow:0 4px 16px rgba(46,125,50,0.35)">
    ${text}
  </a>`
}

function howTo(t: (typeof T)[GiftLang], expiresAt: string, lang: GiftLang) {
  const date = new Date(expiresAt).toLocaleDateString(DATE_LOCALE[lang], {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  return `
    <p style="color:#c8e6c9;font-size:14px;font-weight:700;margin:20px 0 8px">${t.howTitle}</p>
    <ol style="color:#a5d6a7;font-size:13px;line-height:1.9;margin:0;padding-left:18px">
      <li>${t.how1}</li><li>${t.how2}</li><li>${t.how3}</li>
    </ol>
    <p style="color:#558b2f;font-size:12px;margin:14px 0 0">${t.validUntil(date)}</p>`
}

export interface GiftEmailData {
  code: string
  planType: string
  months: number
  buyerEmail: string
  buyerName: string | null
  recipientEmail: string | null
  recipientName: string | null
  message: string | null
  lang: GiftLang
  expiresAt: string
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn('[gift-emails] RESEND_API_KEY not configured — email not sent:', subject)
    return
  }
  await resend.emails.send({ from: FROM, to, subject, html })
}

/** Email al regalado: la tarjeta con el código + mensaje personal del comprador */
export async function sendGiftCardToRecipient(g: GiftEmailData) {
  if (!g.recipientEmail) return
  const t = T[g.lang]
  const plan = GIFT_PLAN_LABELS[g.planType] ?? g.planType
  const months = t.monthsLabel(g.months)
  const recipientFirst = g.recipientName?.split(' ')[0] || (g.lang === 'it' ? 'ciao' : g.lang === 'en' ? 'hey' : 'hola')
  const buyer = g.buyerName || g.buyerEmail
  const html = wrap(`
    <h1 style="color:#e8f5e9;font-size:22px;margin:0 0 14px">🎁 ${t.giftTitle}</h1>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0">
      ${t.giftIntro(buyer, plan, months)}
    </p>
    ${g.message ? `
    <div style="margin-top:16px;background:#0d1f0e;border-left:3px solid #4caf50;border-radius:8px;padding:12px 16px">
      <p style="color:#81c784;font-size:11px;margin:0 0 4px;font-weight:700">${t.messageLabel}</p>
      <p style="color:#c8e6c9;font-size:13px;margin:0;font-style:italic">"${g.message}"</p>
    </div>` : ''}
    ${giftCardVisual(g.code, plan, months)}
    ${howTo(t, g.expiresAt, g.lang)}
    ${cta(t.cta)}
  `, g.lang)
  await send(g.recipientEmail, t.giftSubject(g.recipientName?.split(' ')[0] || ''), html)
}

/** Email al comprador: recibo con el código (la tarjeta es suya si no indicó destinatario) */
export async function sendGiftCardReceipt(g: GiftEmailData) {
  const t = T[g.lang]
  const plan = GIFT_PLAN_LABELS[g.planType] ?? g.planType
  const months = t.monthsLabel(g.months)
  const sentNote = g.recipientEmail && g.recipientEmail !== g.buyerEmail
    ? `<p style="color:#a5d6a7;font-size:13px;line-height:1.7;margin:8px 0 0">${t.receiptSent(g.recipientEmail)}</p>`
    : ''
  const html = wrap(`
    <h1 style="color:#e8f5e9;font-size:22px;margin:0 0 14px">${t.receiptTitle}</h1>
    <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0">
      ${t.receiptIntro(plan, months)}
    </p>
    ${sentNote}
    <p style="color:#a5d6a7;font-size:13px;line-height:1.7;margin:8px 0 0">${t.receiptKeep}</p>
    ${giftCardVisual(g.code, plan, months)}
    ${howTo(t, g.expiresAt, g.lang)}
  `, g.lang)
  await send(g.buyerEmail, t.receiptSubject, html)
}
