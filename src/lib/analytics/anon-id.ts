import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'

export const ANON_COOKIE = 'it_visitor'

/**
 * Devuelve el anon_id de la cookie; si no existe, genera uno nuevo.
 * `shouldSet` indica si el caller debe emitir Set-Cookie (cookie nueva).
 */
export async function getOrCreateAnonId(): Promise<{ anonId: string; shouldSet: boolean }> {
  const store = await cookies()
  const existing = store.get(ANON_COOKIE)?.value
  if (existing) return { anonId: existing, shouldSet: false }
  return { anonId: randomUUID(), shouldSet: true }
}

export const ANON_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: true,
  domain: '.italianto.com',
  maxAge: 60 * 60 * 24 * 365, // 1 año
  path: '/',
}
