import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./admin-notifications', () => ({ notifyAdmin: vi.fn().mockResolvedValue(undefined) }))
import { geminiGenerate, shouldFallback, resetAlertThrottle } from './gemini'
import { notifyAdmin } from './admin-notifications'

const ok = (t: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] }), { status: 200 })
const err = (s: number, m: string) => new Response(JSON.stringify({ error: { message: m } }), { status: s })

describe('geminiGenerate', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    process.env.GEMINI_API_KEY = 'PAID'
    process.env.GEMINI_API_KEY_FALLBACK = 'FREE'
    vi.mocked(notifyAdmin).mockClear()
    resetAlertThrottle()
  })
  afterEach(() => vi.unstubAllGlobals())

  const keyOf = (i: number) => (fetchMock.mock.calls[i][1].headers as Record<string, string>)['x-goog-api-key']
  const urlOf = (i: number) => fetchMock.mock.calls[i][0] as string

  it('usa solo la clave de pago si responde bien (sin clave en la URL)', async () => {
    fetchMock.mockResolvedValueOnce(ok('hola'))
    const r = await geminiGenerate('gemini-2.5-flash', { contents: [] }, 't')
    expect(r.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(keyOf(0)).toBe('PAID')
    expect(urlOf(0)).not.toContain('key=')
    expect(notifyAdmin).not.toHaveBeenCalled()
  })

  it.each([[429, 'x'], [402, 'x'], [503, 'x'], [404, 'models/x is not found'], [403, 'API_KEY_SERVICE_BLOCKED'], [400, 'API key not valid'], [403, 'Quota exceeded']])(
    'reintenta con la gratuita y un modelo Flash Lite ante %s %s',
    async (status, msg) => {
      fetchMock.mockResolvedValueOnce(err(status, msg)).mockResolvedValueOnce(ok('respaldo'))
      const r = await geminiGenerate('gemini-2.5-flash', { contents: [] }, 't')
      expect(r.ok).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(keyOf(1)).toBe('FREE')
      expect(urlOf(1)).toContain('gemini-3.5-flash-lite')
      expect(notifyAdmin).toHaveBeenCalledTimes(1)
    },
  )

  it('no reintenta ante una petición mal formada (400 normal)', async () => {
    fetchMock.mockResolvedValueOnce(err(400, 'Invalid JSON payload received'))
    const r = await geminiGenerate('gemini-2.5-flash', { contents: [] }, 't')
    expect(r.status).toBe(400)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('máximo un aviso por hora aunque el respaldo se use varias veces', async () => {
    fetchMock.mockResolvedValue(err(429, 'x')).mockResolvedValueOnce(err(429, 'x')).mockResolvedValueOnce(ok('a')).mockResolvedValueOnce(err(429, 'x')).mockResolvedValueOnce(ok('b'))
    await geminiGenerate('gemini-2.5-flash', {}, 't'); await geminiGenerate('gemini-2.5-flash', {}, 't')
    expect(notifyAdmin).toHaveBeenCalledTimes(1)
  })

  it('reintenta si falla la red', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNRESET')).mockResolvedValueOnce(ok('r'))
    const r = await geminiGenerate('gemini-2.5-flash', { contents: [] }, 't')
    expect(r.ok).toBe(true)
    expect(keyOf(1)).toBe('FREE')
  })

  it('sin respaldo configurado devuelve el error del principal', async () => {
    delete process.env.GEMINI_API_KEY_FALLBACK
    fetchMock.mockResolvedValueOnce(err(429, 'x'))
    const r = await geminiGenerate('gemini-2.5-flash', { contents: [] }, 't')
    expect(r.status).toBe(429)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('sin clave principal va directo al respaldo', async () => {
    delete process.env.GEMINI_API_KEY
    fetchMock.mockResolvedValueOnce(ok('r'))
    const r = await geminiGenerate('gemini-2.5-flash', { contents: [] }, 't')
    expect(r.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(keyOf(0)).toBe('FREE')
  })

  it('shouldFallback: solo fallos de clave/cuota/servicio', () => {
    expect(shouldFallback(400, 'Invalid JSON payload')).toBe(false)
    expect(shouldFallback(500, 'internal')).toBe(false)
    expect(shouldFallback(429, '')).toBe(true)
  })
})
