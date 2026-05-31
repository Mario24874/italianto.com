'use client'

import { useState } from 'react'
import type { LessonTranslations, VocabularyItem, AudioClip } from '@/types'
import { BookOpen, Headphones, Play, Pause } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import type { Language } from '@/contexts/language-context'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Split a content HTML string into blocks at each <h2> boundary.
 *  Each block keeps the <h2> that opens it (if any).
 *  Returns [{heading: string|null, html: string}]  */
function splitAtH2(html: string): Array<{ heading: string | null; html: string }> {
  // Lookahead split keeps the <h2 tag in the following chunk
  const chunks = html.split(/(?=<h2[\s>])/i).filter(c => c.trim())
  return chunks.map(chunk => {
    const m = chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    const heading = m
      ? m[1].replace(/<[^>]+>/g, '').replace(/&[a-zA-Z0-9#]+;/g, ' ').replace(/\s+/g, ' ').trim()
      : null
    return { heading, html: chunk }
  })
}

/** Normalise for fuzzy section matching: strip emojis/symbols, lowercase, collapse spaces */
function normSec(text: string) {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]/gu, '') // strip emojis
    .replace(/[^\w\sÀ-ɏ]/gu, ' ')  // strip non-word, non-Latin chars
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Returns clips whose section fuzzy-matches the given heading.
 *  "Los Meses" matches "📅 Meses y Días" if either contains the other after normalization. */
function clipsFor(clips: AudioClip[], heading: string | null): AudioClip[] {
  if (!heading) return []
  const nh = normSec(heading)
  if (!nh) return []
  return clips.filter(c => {
    const ns = normSec(c.section ?? '')
    if (!ns) return false
    return nh === ns || nh.includes(ns) || ns.includes(nh)
  })
}


// ─── Prose classes shared across all section fragments ────────────────────────

const PROSE = [
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
  '[&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-sm [&_table]:rounded-xl [&_table]:overflow-hidden',
  '[&_thead]:bg-verde-100/80 dark:[&_thead]:bg-verde-900/60',
  '[&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-verde-800 dark:[&_th]:text-verde-200 [&_th]:font-bold [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide',
  '[&_th]:border-b [&_th]:border-verde-300/60 dark:[&_th]:border-verde-700/40',
  '[&_td]:px-3 [&_td]:py-2 [&_td]:text-verde-700 dark:[&_td]:text-verde-300 [&_td]:border-b [&_td]:border-verde-200/60 dark:[&_td]:border-verde-900/30',
  '[&_tbody_tr:last-child_td]:border-b-0',
  '[&_tbody_tr:hover]:bg-verde-100/60 dark:[&_tbody_tr:hover]:bg-verde-900/20',
  '[&_blockquote]:rounded-xl [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:not-italic',
  '[&_blockquote.tip]:bg-amber-50/80 dark:[&_blockquote.tip]:bg-amber-950/30 [&_blockquote.tip]:border-amber-600/50 [&_blockquote.tip]:text-amber-800 dark:[&_blockquote.tip]:text-amber-200',
  '[&_blockquote.tip_p]:text-amber-700 dark:[&_blockquote.tip_p]:text-amber-300 [&_blockquote.tip_strong]:text-amber-900 dark:[&_blockquote.tip_strong]:text-amber-100',
  '[&_blockquote.info]:bg-blue-50/80 dark:[&_blockquote.info]:bg-blue-950/30 [&_blockquote.info]:border-blue-600/50 [&_blockquote.info]:text-blue-800 dark:[&_blockquote.info]:text-blue-200',
  '[&_blockquote.info_p]:text-blue-700 dark:[&_blockquote.info_p]:text-blue-300 [&_blockquote.info_strong]:text-blue-900 dark:[&_blockquote.info_strong]:text-blue-100',
  '[&_blockquote.dialogo]:bg-verde-50/80 dark:[&_blockquote.dialogo]:bg-verde-950/30 [&_blockquote.dialogo]:border-verde-600/50 [&_blockquote.dialogo]:text-verde-800 dark:[&_blockquote.dialogo]:text-verde-200 [&_blockquote.dialogo]:font-mono [&_blockquote.dialogo]:text-xs',
  '[&_blockquote.dialogo_p]:mb-1 [&_blockquote.dialogo_p]:text-verde-700 dark:[&_blockquote.dialogo_p]:text-verde-300',
  '[&_blockquote.dialogo_strong]:text-verde-900 dark:[&_blockquote.dialogo_strong]:text-verde-100',
  '[&_blockquote:not(.tip):not(.info):not(.dialogo)]:border-verde-400/60 dark:[&_blockquote:not(.tip):not(.info):not(.dialogo)]:border-verde-700/40',
  '[&_blockquote:not(.tip):not(.info):not(.dialogo)]:bg-verde-50/60 dark:[&_blockquote:not(.tip):not(.info):not(.dialogo)]:bg-verde-950/20',
  '[&_blockquote:not(.tip):not(.info):not(.dialogo)]:text-verde-700 dark:[&_blockquote:not(.tip):not(.info):not(.dialogo)]:text-verde-400 [&_blockquote:not(.tip):not(.info):not(.dialogo)]:italic',
].join(' ')

// ─── Inline audio player (compact) ───────────────────────────────────────────

const LANG_LABELS: Record<string, { flag: string; label: string }> = {
  es: { flag: '🇪🇸', label: 'Español' },
  en: { flag: '🇬🇧', label: 'English' },
  it: { flag: '🇮🇹', label: 'Italiano' },
}

interface InlineAudioProps {
  clips: AudioClip[]
  playing: string | null
  onPlay: (id: string, el: HTMLAudioElement) => void
}

function InlineAudio({ clips, playing, onPlay }: InlineAudioProps) {
  if (clips.length === 0) return null
  return (
    <div className="my-4 rounded-xl border border-amber-200/70 dark:border-amber-800/30 bg-amber-50/70 dark:bg-amber-950/10 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Headphones size={13} className="text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
          Pronunciación
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {clips.map(clip => (
          <div key={clip.id} data-clip-row className="flex items-center gap-3">
            <button
              type="button"
              onClick={e => {
                const row = (e.currentTarget as HTMLElement).closest('[data-clip-row]')
                const audioEl = row?.querySelector('audio') as HTMLAudioElement | null
                if (audioEl) onPlay(clip.id, audioEl)
              }}
              className={`shrink-0 size-7 rounded-full flex items-center justify-center transition-colors ${
                playing === clip.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50'
              }`}
            >
              {playing === clip.id ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-amber-900 dark:text-amber-200">{clip.title}</span>
              {clip.description && (
                <span className="ml-2 text-xs text-amber-600 dark:text-amber-600">{clip.description}</span>
              )}
            </div>
            <audio data-clip={clip.id} src={clip.url} preload="none" className="hidden" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  defaultContent: string
  defaultGrammarNotes: string
  defaultVocabulary: VocabularyItem[]
  translations: LessonTranslations
  audioClips?: AudioClip[]
}

export function LessonContentSwitcher({
  defaultContent,
  defaultGrammarNotes,
  defaultVocabulary,
  translations,
  audioClips = [],
}: Props) {
  const { lang, setLang } = useLanguage()
  const [playingId, setPlayingId] = useState<string | null>(null)

  // Available languages: ES always present + those with a generated translation
  const available: Language[] = ['es', ...(['en', 'it'] as Language[]).filter(
    l => !!translations[l]?.content_html
  )]

  const activeLang: Language = available.includes(lang) ? lang : 'es'
  const missingTranslation = lang !== 'es' && !available.includes(lang)

  const switchLang = (l: Language) => setLang(l)

  // Resolve content for active language
  const tr = translations[activeLang] ?? null
  const contentHtml = tr?.content_html ?? (activeLang === 'es' ? defaultContent : null) ?? defaultContent
  const grammarNotes = tr?.grammar_notes ?? (activeLang === 'es' ? defaultGrammarNotes : null) ?? defaultGrammarNotes
  const vocabulary = tr?.vocabulary ?? defaultVocabulary

  // Split content into sections at <h2> boundaries
  const sections = contentHtml ? splitAtH2(contentHtml) : []

  // Always use the default (Spanish) content headings for audio matching.
  // When language changes, section headings change too ("Suoni" → "Sounds"),
  // breaking fuzzy match. Index-based fallback keeps clips in the right section.
  const defaultSections = defaultContent ? splitAtH2(defaultContent) : sections

  // Compute which clips match inline (so the rest can be shown at the end)
  const matchedIds = new Set<string>()
  sections.forEach((_, i) => {
    const referenceHeading = defaultSections[i]?.heading ?? sections[i]?.heading
    for (const c of clipsFor(audioClips, referenceHeading)) matchedIds.add(c.id)
  })
  // "Global" = clips with no section + clips whose section didn't match any heading
  const globalAudio = audioClips.filter(c => !matchedIds.has(c.id))

  // Audio play handler — only one clip plays at a time across the whole lesson
  const handlePlay = (clipId: string, audioEl: HTMLAudioElement) => {
    if (playingId === clipId) {
      audioEl.pause()
      setPlayingId(null)
    } else {
      document.querySelectorAll('audio[data-clip]').forEach(el => (el as HTMLAudioElement).pause())
      audioEl.play().catch(() => {})
      setPlayingId(clipId)
      audioEl.onended = () => setPlayingId(null)
    }
  }

  const VOCAB_LABEL: Record<Language, string> = {
    es: `Vocabulario (${vocabulary.length} palabras)`,
    en: `Vocabulary (${vocabulary.length} words)`,
    it: `Vocabolario (${vocabulary.length} parole)`,
  }

  const GRAMMAR_LABEL: Record<Language, string> = {
    es: 'Notas de gramática',
    en: 'Grammar notes',
    it: 'Note grammaticali',
  }

  return (
    <div className="space-y-5">
      {/* ── Language tabs ── */}
      {available.length > 1 && (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-verde-100 dark:bg-verde-950/40 border border-verde-200 dark:border-verde-800/30 w-fit">
          {available.map(l => {
            const meta = LANG_LABELS[l]
            if (!meta) return null
            return (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeLang === l
                    ? 'bg-verde-700 text-white shadow-sm'
                    : 'text-verde-700 dark:text-verde-500 hover:text-verde-900 dark:hover:text-verde-300 hover:bg-verde-200 dark:hover:bg-verde-900/40',
                ].join(' ')}
              >
                <span>{meta.flag}</span>
                <span>{meta.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Missing translation notice ── */}
      {missingTranslation && (
        <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-700/30 text-sm">
          <span className="text-amber-600 dark:text-amber-400 mt-0.5">⚠️</span>
          <p className="text-amber-800 dark:text-amber-300 leading-snug">
            {lang === 'en'
              ? 'This lesson is not yet available in English. Showing Spanish version.'
              : 'Questa lezione non è ancora disponibile in italiano. Visualizzazione in spagnolo.'}
          </p>
        </div>
      )}

      {/* ── Content split into sections with inline audio ── */}
      {sections.length > 0 && (
        <div>
          {sections.map((sec, i) => {
            const referenceHeading = defaultSections[i]?.heading ?? sec.heading
            const inlineClips = clipsFor(audioClips, referenceHeading)
            return (
              <div key={i}>
                {/* HTML block for this section */}
                <div
                  className={PROSE}
                  dangerouslySetInnerHTML={{ __html: sec.html }}
                />
                {/* Audio clips assigned to this section — hidden when empty */}
                {inlineClips.length > 0 && (
                  <InlineAudio clips={inlineClips} playing={playingId} onPlay={handlePlay} />
                )}
              </div>
            )
          })}

          {/* Global / unmatched clips shown after all content */}
          {globalAudio.length > 0 && (
            <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/30 bg-amber-50/60 dark:bg-amber-950/10 px-4 py-3 mt-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Headphones size={13} className="text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  Pronunciación general
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {globalAudio.map(clip => (
                  <div key={clip.id} data-clip-row className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={e => {
                        const row = (e.currentTarget as HTMLElement).closest('[data-clip-row]')
                        const audioEl = row?.querySelector('audio') as HTMLAudioElement | null
                        if (audioEl) handlePlay(clip.id, audioEl)
                      }}
                      className={`shrink-0 size-7 rounded-full flex items-center justify-center transition-colors ${
                        playingId === clip.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50'
                      }`}
                    >
                      {playingId === clip.id ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-200">{clip.title}</span>
                      {clip.description && (
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-600">{clip.description}</span>
                      )}
                    </div>
                    <audio data-clip={clip.id} src={clip.url} preload="none" className="hidden" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Vocabulary ── */}
      {vocabulary.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-verde-600 dark:text-verde-500" />
            <h2 className="font-semibold text-verde-700 dark:text-verde-200 text-sm uppercase tracking-wide">
              {VOCAB_LABEL[activeLang]}
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
                {item.example && <p className="text-verde-600 dark:text-verde-500 text-xs mt-1 italic">{item.example}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Grammar Notes ── */}
      {grammarNotes && (
        <div>
          <h2 className="font-semibold text-verde-700 dark:text-verde-200 text-sm uppercase tracking-wide mb-3">
            {GRAMMAR_LABEL[activeLang]}
          </h2>
          <p className="text-verde-700 dark:text-verde-400 text-sm leading-relaxed whitespace-pre-line">{grammarNotes}</p>
        </div>
      )}
    </div>
  )
}
