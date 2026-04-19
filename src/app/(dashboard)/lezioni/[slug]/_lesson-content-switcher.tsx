'use client'

import { useState, useEffect } from 'react'
import type { LessonTranslations, VocabularyItem } from '@/types'
import { BookOpen } from 'lucide-react'

const LS_KEY = 'italianto_lesson_lang'

const LANG_LABELS: Record<string, { flag: string; label: string }> = {
  es: { flag: '🇪🇸', label: 'Español' },
  en: { flag: '🇬🇧', label: 'English' },
  it: { flag: '🇮🇹', label: 'Italiano' },
}

interface Props {
  /** Default content in Spanish */
  defaultContent: string
  defaultGrammarNotes: string
  defaultVocabulary: VocabularyItem[]
  /** Translated versions: { en: {...}, it: {...} } */
  translations: LessonTranslations
}

export function LessonContentSwitcher({
  defaultContent,
  defaultGrammarNotes,
  defaultVocabulary,
  translations,
}: Props) {
  // Build available language list: Spanish always first, then whatever has a translation
  const available: string[] = ['es', ...Object.keys(translations).filter(l => !!translations[l as 'en' | 'it' | 'es'])]

  const [lang, setLang] = useState<string>('es')

  // Restore preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved && available.includes(saved)) setLang(saved)
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchLang = (l: string) => {
    setLang(l)
    try { localStorage.setItem(LS_KEY, l) } catch { /* ignore */ }
  }

  // Resolve content for selected lang — check translations first (ES may have a generated translation)
  const t = translations[lang as 'en' | 'it' | 'es'] ?? null
  const contentHtml = t?.content_html ?? (lang === 'es' ? defaultContent : null) ?? defaultContent
  const grammarNotes = t?.grammar_notes ?? (lang === 'es' ? defaultGrammarNotes : null) ?? defaultGrammarNotes
  const vocabulary = t?.vocabulary ?? defaultVocabulary

  return (
    <div className="space-y-5">
      {/* ── Language switcher tabs (only shown if >1 language available) ── */}
      {available.length > 1 && (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-verde-950/40 border border-verde-800/30 w-fit">
          {available.map(l => {
            const meta = LANG_LABELS[l]
            if (!meta) return null
            const active = lang === l
            return (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  active
                    ? 'bg-verde-700 text-white shadow-sm'
                    : 'text-verde-500 hover:text-verde-300 hover:bg-verde-900/40',
                ].join(' ')}
              >
                <span>{meta.flag}</span>
                <span>{meta.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Lesson content ── */}
      {contentHtml && (
        <div
          className={[
            'prose prose-sm max-w-none',
            '[&_h2]:text-verde-800 dark:[&_h2]:text-verde-100 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:mb-3 [&_h2]:mt-8',
            '[&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-verde-300/60 dark:[&_h2]:border-verde-800/40',
            '[&_h3]:text-verde-700 dark:[&_h3]:text-verde-200 [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base',
            '[&_h4]:text-verde-700 dark:[&_h4]:text-verde-300 [&_h4]:font-semibold [&_h4]:mb-1.5 [&_h4]:mt-4 [&_h4]:text-sm',
            '[&_p]:text-verde-800 dark:[&_p]:text-verde-400 [&_p]:leading-relaxed [&_p]:mb-3',
            '[&_strong]:text-verde-900 dark:[&_strong]:text-verde-100 [&_strong]:font-bold',
            '[&_em]:text-verde-700 dark:[&_em]:text-verde-300 [&_em]:italic',
            '[&_hr]:border-verde-300/60 dark:[&_hr]:border-verde-800/30 [&_hr]:my-6',
            '[&_ul]:text-verde-800 dark:[&_ul]:text-verde-400 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3',
            '[&_ol]:text-verde-800 dark:[&_ol]:text-verde-400 [&_ol]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3',
            '[&_li]:text-verde-800 dark:[&_li]:text-verde-400 [&_li]:leading-relaxed',
            '[&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4 [&_img]:mx-auto [&_img]:block',
            '[&_img]:border [&_img]:border-verde-300/60 dark:[&_img]:border-verde-800/30',
            '[&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-sm',
            '[&_table]:rounded-xl [&_table]:overflow-hidden',
            '[&_thead]:bg-verde-100/80 dark:[&_thead]:bg-verde-900/60',
            '[&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-verde-800 dark:[&_th]:text-verde-200 [&_th]:font-bold [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide',
            '[&_th]:border-b [&_th]:border-verde-300/60 dark:[&_th]:border-verde-700/40',
            '[&_td]:px-3 [&_td]:py-2 [&_td]:text-verde-700 dark:[&_td]:text-verde-300 [&_td]:border-b [&_td]:border-verde-200/60 dark:[&_td]:border-verde-900/30',
            '[&_tbody_tr:last-child_td]:border-b-0',
            '[&_tbody_tr:hover]:bg-verde-100/60 dark:[&_tbody_tr:hover]:bg-verde-900/20',
            '[&_blockquote]:rounded-xl [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-4',
            '[&_blockquote]:border-l-4 [&_blockquote]:not-italic',
            '[&_blockquote.tip]:bg-amber-50/80 dark:[&_blockquote.tip]:bg-amber-950/30 [&_blockquote.tip]:border-amber-600/50',
            '[&_blockquote.tip]:text-amber-800 dark:[&_blockquote.tip]:text-amber-200',
            '[&_blockquote.tip_p]:text-amber-700 dark:[&_blockquote.tip_p]:text-amber-300 [&_blockquote.tip_strong]:text-amber-900 dark:[&_blockquote.tip_strong]:text-amber-100',
            '[&_blockquote.info]:bg-blue-50/80 dark:[&_blockquote.info]:bg-blue-950/30 [&_blockquote.info]:border-blue-600/50',
            '[&_blockquote.info]:text-blue-800 dark:[&_blockquote.info]:text-blue-200',
            '[&_blockquote.info_p]:text-blue-700 dark:[&_blockquote.info_p]:text-blue-300 [&_blockquote.info_strong]:text-blue-900 dark:[&_blockquote.info_strong]:text-blue-100',
            '[&_blockquote.dialogo]:bg-verde-50/80 dark:[&_blockquote.dialogo]:bg-verde-950/30 [&_blockquote.dialogo]:border-verde-600/50',
            '[&_blockquote.dialogo]:text-verde-800 dark:[&_blockquote.dialogo]:text-verde-200 [&_blockquote.dialogo]:font-mono [&_blockquote.dialogo]:text-xs',
            '[&_blockquote.dialogo_p]:mb-1 [&_blockquote.dialogo_p]:text-verde-700 dark:[&_blockquote.dialogo_p]:text-verde-300',
            '[&_blockquote.dialogo_strong]:text-verde-900 dark:[&_blockquote.dialogo_strong]:text-verde-100',
            '[&_blockquote:not(.tip):not(.info):not(.dialogo)]:border-verde-400/60 dark:[&_blockquote:not(.tip):not(.info):not(.dialogo)]:border-verde-700/40',
            '[&_blockquote:not(.tip):not(.info):not(.dialogo)]:bg-verde-50/60 dark:[&_blockquote:not(.tip):not(.info):not(.dialogo)]:bg-verde-950/20',
            '[&_blockquote:not(.tip):not(.info):not(.dialogo)]:text-verde-700 dark:[&_blockquote:not(.tip):not(.info):not(.dialogo)]:text-verde-400 [&_blockquote:not(.tip):not(.info):not(.dialogo)]:italic',
          ].join(' ')}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      )}

      {/* ── Vocabulary ── */}
      {vocabulary.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-verde-500" />
            <h2 className="font-semibold text-verde-300 text-sm uppercase tracking-wide">
              Vocabolario ({vocabulary.length} parole)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vocabulary.map((item, i) => (
              <div key={i} className="rounded-xl border border-verde-200/60 dark:border-verde-900/30 bg-verde-50/60 dark:bg-verde-950/20 px-4 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-verde-800 dark:text-verde-200 text-sm">{item.word}</span>
                  <span className="text-verde-500 text-xs">→</span>
                  <span className="text-verde-700 dark:text-verde-400 text-sm">{item.translation}</span>
                </div>
                {item.example && <p className="text-verde-600 text-xs mt-1 italic">{item.example}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Grammar Notes ── */}
      {grammarNotes && (
        <div>
          <h2 className="font-semibold text-verde-300 text-sm uppercase tracking-wide mb-3">
            {lang === 'es' ? 'Note di grammatica'
              : lang === 'en' ? 'Grammar notes'
              : 'Note grammaticali'}
          </h2>
          <p className="text-verde-700 dark:text-verde-400 text-sm leading-relaxed whitespace-pre-line">{grammarNotes}</p>
        </div>
      )}
    </div>
  )
}
