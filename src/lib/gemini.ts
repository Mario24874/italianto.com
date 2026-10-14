import { notifyAdmin } from './admin-notifications'

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const QUOTA_TEXT = /quota|billing|exceeded|resource_exhausted|api[_ ]key (not valid|invalid|expired)|api_key_(invalid|service_blocked)|permission_denied|blocked|expired|suspended/i

let lastAlertAt = 0
const ALERT_EVERY_MS = 60 * 60 * 1000

/** Solo para pruebas. */
export function resetAlertThrottle() {
  lastAlertAt = 0
}

/** ¿Vale la pena reintentar con la clave de respaldo? Solo fallos de clave, cuota, facturación, modelo o servicio; no peticiones mal formadas. */
export function shouldFallback(status: number, errText: string): boolean {
  if (status === 429 || status === 402 || status === 503 || status === 404) return true
  if ((status === 400 || status === 401 || status === 403) && QUOTA_TEXT.test(errText)) return true
  return false
}

function call(model: string, key: string, body: object): Promise<Response> {
  return fetch(`${BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
  })
}

function alertFallback(caller: string, model: string, fbModel: string, why: string, fallbackFailed: boolean) {
  const now = Date.now()
  if (now - lastAlertAt < ALERT_EVERY_MS) return
  lastAlertAt = now
  const title = fallbackFailed ? 'Gemini: falló también la clave de respaldo' : 'Gemini: se usó la clave de respaldo (gratuita)'
  void notifyAdmin({
    type: 'gemini_fallback',
    severity: fallbackFailed ? 'critical' : 'warning',
    title,
    message: `Origen: ${caller}. Modelo pedido: ${model} → ${fbModel}. Motivo del principal: ${why}`,
    metadata: { caller, model, fbModel },
    emailSubject: `⚠️ ${title}`,
    emailRows: [['Origen', caller], ['Modelo', `${model} → ${fbModel}`], ['Motivo', why]],
  }).catch(() => {})
}

/**
 * generateContent con respaldo: clave de pago (GEMINI_API_KEY) primero; si falla por cuota/facturación/clave/modelo/servicio,
 * reintenta con GEMINI_API_KEY_FALLBACK (proyecto gratuito) y un modelo Flash Lite. Devuelve la Response de la llamada que cuente.
 */
export async function geminiGenerate(model: string, body: object, caller: string): Promise<Response> {
  const primary = process.env.GEMINI_API_KEY ?? ''
  const fallback = process.env.GEMINI_API_KEY_FALLBACK ?? ''
  const fbModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite'

  let why = ''
  let first: Response | null = null
  if (!primary) {
    why = 'GEMINI_API_KEY no configurada'
  } else {
    try {
      const res = await call(model, primary, body)
      if (res.ok) return res
      const errText = await res.clone().text()
      if (!fallback || !shouldFallback(res.status, errText)) return res
      first = res
      why = `HTTP ${res.status} ${errText.slice(0, 160).replace(/\s+/g, ' ')}`
    } catch (err) {
      if (!fallback) throw err
      why = `sin respuesta: ${err instanceof Error ? err.message : String(err)}`
    }
  }
  if (!fallback) throw new Error('GEMINI_API_KEY no configurada y sin respaldo')

  console.warn('[gemini] usando respaldo', caller, why)
  try {
    const res = await call(fbModel, fallback, body)
    alertFallback(caller, model, fbModel, why, !res.ok)
    return res
  } catch (err) {
    alertFallback(caller, model, fbModel, why, true)
    if (first) return first
    throw err
  }
}

/** Clave para operaciones que no son generateContent (token efímero del modo Live): mismos criterios sobre el mensaje de error. */
export function fallbackKey(): string {
  return process.env.GEMINI_API_KEY_FALLBACK ?? ''
}
export function errorSuggestsFallback(message: string): boolean {
  return /\b(429|402|503|404)\b/.test(message) || QUOTA_TEXT.test(message)
}
