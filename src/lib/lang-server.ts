import { cookies } from 'next/headers'
import { translations } from '@/contexts/language-context'
import type { Language, Translations } from '@/contexts/language-context'

const VALID_LANGS: Language[] = ['es', 'it', 'en']

export async function getServerLang(): Promise<{ lang: Language; t: Translations }> {
  const store = await cookies()
  const raw = store.get('italianto-lang')?.value as Language | undefined
  const lang: Language = raw && VALID_LANGS.includes(raw) ? raw : 'es'
  return { lang, t: translations[lang] }
}
