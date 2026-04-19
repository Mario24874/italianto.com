'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  BookOpen, Plus, Pencil, Trash2, Loader2, X,
  ToggleLeft, ToggleRight, GripVertical,
  Upload, FileText, Sparkles, AlertTriangle,
  Video, Captions, Dumbbell,
  CheckCircle2, Languages, Trash,
  ChevronDown, ChevronUp, ListOrdered, Headphones,
} from 'lucide-react'
import type { LessonRow, LessonLevel, LessonStatus, VocabularyItem, Exercise, LessonTranslations, AudioClip } from '@/types'
import { RichEditor } from './_rich-editor'

const LEVELS: LessonLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const SUBTITLE_LANGS: { value: 'es' | 'en' | 'it'; label: string; flag: string }[] = [
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
]

const LEVEL_COLORS: Record<LessonLevel, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  A2: 'bg-green-900/50 text-green-300 border-green-700/40',
  B1: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  B2: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
  C1: 'bg-red-900/50 text-red-300 border-red-700/40',
  C2: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

interface LessonFormData {
  title: string
  slug: string
  level: LessonLevel
  status: LessonStatus
  content_html: string
  grammar_notes: string
  vocabulary: VocabularyItem[]
  intro_video_url: string
  video_subtitles: { es: string; en: string; it: string }
  exercises: Exercise[]
  audio_clips: AudioClip[]
}

const emptyForm = (): LessonFormData => ({
  title: '',
  slug: '',
  level: 'A1',
  status: 'draft',
  content_html: '',
  grammar_notes: '',
  vocabulary: [],
  intro_video_url: '',
  video_subtitles: { es: '', en: '', it: '' },
  exercises: [],
  audio_clips: [],
})

// ─── AI Lesson Import Panel ────────────────────────────────────────────────────
function ImportPanel({ onImport }: { onImport: (data: Partial<LessonFormData>) => void }) {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const ext = file.name.toLowerCase()
    const valid = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      .includes(file.type) || ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.txt') || ext.endsWith('.md')
    if (!valid) { setError('Usa PDF, DOCX o TXT.'); return }
    if (file.size > 15 * 1024 * 1024) { setError('Máximo 15 MB.'); return }

    setFileName(file.name); setImporting(true); setError(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/admin/lessons/import', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error al importar (${res.status})`)
      onImport(data.lesson)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al importar')
    } finally { setImporting(false) }
  }

  return (
    <div className="rounded-xl border border-dashed border-verde-700/50 bg-verde-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-verde-400" />
        <span className="text-xs font-semibold text-verde-300 uppercase tracking-wide">Importar lección con IA</span>
        <span className="text-xs text-verde-600">— PDF, DOCX o TXT</span>
      </div>
      <div
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center gap-2 py-5 rounded-lg border border-verde-800/30 bg-verde-950/30 cursor-pointer hover:bg-verde-900/20 hover:border-verde-700/50 transition-all group"
      >
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.md"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {importing ? (
          <>
            <Loader2 size={22} className="animate-spin text-verde-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-verde-300">Analizando con IA...</p>
              <p className="text-xs text-verde-600 mt-0.5">{fileName}</p>
            </div>
          </>
        ) : (
          <>
            <Upload size={22} className="text-verde-600 group-hover:text-verde-400 transition-colors" />
            <p className="text-sm text-verde-400 group-hover:text-verde-300">Arrastra o haz clic para seleccionar</p>
            <p className="text-xs text-verde-600">Gemini leerá el archivo y completará todos los campos</p>
          </>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
          <AlertTriangle size={13} className="shrink-0" />{error}
        </div>
      )}
    </div>
  )
}

// ─── Exercise Import Panel ─────────────────────────────────────────────────────
function ExerciseImportPanel({
  onImport,
  existingCount,
}: {
  onImport: (exercises: Exercise[]) => void
  existingCount: number
}) {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const ext = file.name.toLowerCase()
    const valid = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      .includes(file.type) || ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.txt') || ext.endsWith('.md')
    if (!valid) { setError('Usa PDF, DOCX o TXT.'); return }
    if (file.size > 15 * 1024 * 1024) { setError('Máximo 15 MB.'); return }

    setFileName(file.name); setImporting(true); setError(null)
    const form = new FormData()
    form.append('file', file)
    form.append('language', 'es')
    try {
      const res = await fetch('/api/admin/lessons/import-exercises', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar ejercicios')
      onImport(data.exercises)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally { setImporting(false) }
  }

  return (
    <div className="rounded-xl border border-dashed border-blue-700/40 bg-blue-950/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Ejercicios interactivos</span>
        </div>
        {existingCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 size={12} />{existingCount} ejercicios generados
          </span>
        )}
      </div>
      <div
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center gap-2 py-4 rounded-lg border border-blue-800/30 bg-blue-950/20 cursor-pointer hover:bg-blue-900/20 hover:border-blue-700/40 transition-all group"
      >
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.md"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {importing ? (
          <>
            <Loader2 size={20} className="animate-spin text-blue-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-blue-300">Generando ejercicios con IA...</p>
              <p className="text-xs text-blue-600 mt-0.5">{fileName}</p>
            </div>
          </>
        ) : (
          <>
            <Upload size={20} className="text-blue-600 group-hover:text-blue-400 transition-colors" />
            <p className="text-sm text-blue-400 group-hover:text-blue-300">
              {existingCount > 0 ? 'Reemplazar guía de ejercicios' : 'Subir guía de ejercicios'}
            </p>
            <p className="text-xs text-blue-600 text-center">
              Gemini generará ejercicios interactivos a partir del archivo
            </p>
          </>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
          <AlertTriangle size={13} className="shrink-0" />{error}
        </div>
      )}
    </div>
  )
}

// ─── Video Upload Section ──────────────────────────────────────────────────────
function VideoSection({
  videoUrl,
  subtitles,
  onChange,
}: {
  videoUrl: string
  subtitles: { es: string; en: string; it: string }
  onChange: (videoUrl: string, subtitles: { es: string; en: string; it: string }) => void
}) {
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingLang, setUploadingLang] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const subtitleRefs = { es: useRef<HTMLInputElement>(null), en: useRef<HTMLInputElement>(null), it: useRef<HTMLInputElement>(null) }

  // Upload video via signed URL (direct to Supabase, no Next.js size limit)
  const handleVideoFile = async (file: File) => {
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|ogg)$/i)) {
      alert('Usa MP4, WebM o MOV.'); return
    }
    if (file.size > 500 * 1024 * 1024) { alert('Máximo 500 MB para video.'); return }

    setUploadingVideo(true); setVideoProgress(0)
    try {
      // 1. Get signed URL
      const res = await fetch('/api/admin/lessons/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, folder: 'videos' }),
      })
      const { signedUrl, publicUrl } = await res.json()
      if (!res.ok) throw new Error('No se pudo obtener URL de carga')

      // 2. Upload directly to Supabase Storage using XMLHttpRequest for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setVideoProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Error de red al subir video'))
        xhr.send(file)
      })

      onChange(publicUrl, subtitles)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir video')
    } finally { setUploadingVideo(false); setVideoProgress(0) }
  }

  // Upload .vtt subtitle file
  const handleSubtitleFile = async (file: File, lang: 'es' | 'en' | 'it') => {
    if (!file.name.endsWith('.vtt')) { alert('El archivo de subtítulos debe ser .vtt'); return }
    if (file.size > 2 * 1024 * 1024) { alert('El archivo .vtt es muy grande (máx 2 MB)'); return }

    setUploadingLang(lang)
    try {
      const res = await fetch('/api/admin/lessons/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: 'text/vtt', folder: 'subtitles' }),
      })
      const { signedUrl, publicUrl } = await res.json()
      if (!res.ok) throw new Error('No se pudo obtener URL de carga')

      await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': 'text/vtt' }, body: file })

      onChange(videoUrl, { ...subtitles, [lang]: publicUrl })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir subtítulo')
    } finally { setUploadingLang(null) }
  }

  return (
    <div className="rounded-xl border border-purple-800/30 bg-purple-950/10 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Video size={14} className="text-purple-400" />
        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Video introductorio</span>
        <span className="text-xs text-purple-600">— opcional</span>
      </div>

      {/* Video upload area */}
      <div
        onClick={() => !uploadingVideo && videoInputRef.current?.click()}
        className={[
          'flex flex-col items-center gap-2 py-5 rounded-lg border border-purple-800/30 transition-all',
          uploadingVideo ? 'bg-purple-950/30 cursor-wait' : 'bg-purple-950/20 cursor-pointer hover:bg-purple-900/20 hover:border-purple-700/40 group',
        ].join(' ')}
      >
        <input ref={videoInputRef} type="file" className="hidden" accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.mov"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoFile(f) }} />

        {uploadingVideo ? (
          <div className="w-full px-6 space-y-2">
            <div className="flex justify-between text-xs text-purple-400">
              <span>Subiendo video...</span>
              <span>{videoProgress}%</span>
            </div>
            <div className="h-2 bg-purple-950/60 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
            </div>
          </div>
        ) : videoUrl ? (
          <div className="text-center space-y-1 px-4">
            <CheckCircle2 size={20} className="text-green-400 mx-auto" />
            <p className="text-xs text-green-400 font-medium">Video cargado</p>
            <p className="text-[10px] text-purple-600 break-all">{videoUrl.split('/').pop()}</p>
            <button type="button" onClick={e => { e.stopPropagation(); onChange('', subtitles) }}
              className="text-xs text-red-400 hover:text-red-300 mt-1">Quitar video</button>
          </div>
        ) : (
          <>
            <Video size={22} className="text-purple-600 group-hover:text-purple-400 transition-colors" />
            <p className="text-sm text-purple-400 group-hover:text-purple-300">Subir video introductorio</p>
            <p className="text-xs text-purple-600">MP4, WebM o MOV · máx 500 MB</p>
          </>
        )}
      </div>

      {/* Subtitle uploads */}
      {videoUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-purple-400">
            <Captions size={12} />
            <span className="font-medium">Subtítulos (.vtt) — opcional</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['es', 'en', 'it'] as const).map(lang => {
              const flag = SUBTITLE_LANGS.find(l => l.value === lang)?.flag
              const label = SUBTITLE_LANGS.find(l => l.value === lang)?.label
              const ref = subtitleRefs[lang]
              const hasFile = !!subtitles[lang]
              return (
                <div key={lang}>
                  <input ref={ref} type="file" className="hidden" accept=".vtt"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleSubtitleFile(f, lang) }} />
                  <button
                    type="button"
                    onClick={() => ref.current?.click()}
                    disabled={uploadingLang === lang}
                    className={[
                      'w-full flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs transition-all',
                      hasFile
                        ? 'border-green-700/50 bg-green-950/20 text-green-400'
                        : 'border-purple-800/30 bg-purple-950/20 text-purple-500 hover:border-purple-700/40 hover:text-purple-300',
                    ].join(' ')}
                  >
                    {uploadingLang === lang
                      ? <Loader2 size={14} className="animate-spin" />
                      : hasFile ? <CheckCircle2 size={14} /> : <Upload size={14} />}
                    <span>{flag} {label}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Translation Panel ────────────────────────────────────────────────────────
const TRANSLATION_LANGS: { value: 'en' | 'it' | 'es'; label: string; flag: string }[] = [
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
]

function TranslationPanel({
  lessonId,
  translations,
  onUpdate,
}: {
  lessonId: string
  translations: LessonTranslations
  onUpdate: (t: LessonTranslations) => void
}) {
  const [translating, setTranslating] = useState<'en' | 'it' | 'es' | null>(null)
  const [deleting, setDeleting] = useState<'en' | 'it' | 'es' | null>(null)

  const handleTranslate = async (lang: 'en' | 'it' | 'es') => {
    setTranslating(lang)
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al traducir')
      onUpdate({ ...translations, [lang]: data.translation })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al traducir')
    } finally { setTranslating(null) }
  }

  const handleDelete = async (lang: 'en' | 'it' | 'es') => {
    if (!confirm('¿Eliminar esta traducción?')) return
    setDeleting(lang)
    try {
      await fetch(`/api/admin/lessons/${lessonId}/translate?lang=${lang}`, { method: 'DELETE' })
      const updated = { ...translations }
      delete updated[lang]
      onUpdate(updated)
    } finally { setDeleting(null) }
  }

  return (
    <div className="rounded-xl border border-amber-800/30 bg-amber-950/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Languages size={14} className="text-amber-400" />
        <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Traducciones automáticas</span>
        <span className="text-xs text-amber-700">— el alumno elige el idioma</span>
      </div>
      <p className="text-xs text-amber-700/80">
        Gemini traducirá las explicaciones. Las palabras y frases en italiano permanecen sin cambios.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {TRANSLATION_LANGS.map(({ value, label, flag }) => {
          const exists = !!translations[value]
          const isTranslating = translating === value
          const isDeleting = deleting === value
          return (
            <div key={value} className={[
              'flex items-center gap-2 rounded-lg border px-3 py-2.5',
              exists
                ? 'border-green-700/40 bg-green-950/20'
                : 'border-amber-800/20 bg-amber-950/20',
            ].join(' ')}>
              <span className="text-base">{flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-200">{label}</p>
                <p className="text-[10px] text-amber-700">{exists ? 'Traducido' : 'Sin traducción'}</p>
              </div>
              {exists ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTranslate(value)}
                    disabled={!!translating}
                    title="Re-generar traducción"
                    className="p-1 text-amber-500 hover:text-amber-300 transition-colors disabled:opacity-40"
                  >
                    {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(value)}
                    disabled={!!deleting}
                    title="Eliminar traducción"
                    className="p-1 text-red-600 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash size={12} />}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTranslate(value)}
                  disabled={!!translating}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-800/30 hover:bg-amber-700/40 text-amber-300 transition-colors disabled:opacity-40"
                >
                  {isTranslating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Generar
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Audio Section ────────────────────────────────────────────────────────────
function AudioSection({
  clips,
  onChange,
}: {
  clips: AudioClip[]
  onChange: (clips: AudioClip[]) => void
}) {
  const [uploading, setUploading] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const allowed = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac']
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|ogg|wav|webm|aac|m4a)$/i)) {
      alert('Usa MP3, OGG, WAV o AAC.'); return
    }
    if (file.size > 50 * 1024 * 1024) { alert('Máximo 50 MB por audio.'); return }

    const tempId = `audio_${Date.now()}`
    setUploading(tempId)
    try {
      const res = await fetch('/api/admin/lessons/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'audio/mpeg', folder: 'audios' }),
      })
      const { signedUrl, publicUrl } = await res.json()
      if (!res.ok) throw new Error('No se pudo obtener URL de carga')
      await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'audio/mpeg' }, body: file })
      const newClip: AudioClip = { id: tempId, title: file.name.replace(/\.[^.]+$/, ''), url: publicUrl }
      onChange([...clips, newClip])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir audio')
    } finally { setUploading(null) }
  }

  const updateClip = (i: number, field: keyof AudioClip, val: string) =>
    onChange(clips.map((c, idx) => idx === i ? { ...c, [field]: val } : c))

  const removeClip = (i: number) => onChange(clips.filter((_, idx) => idx !== i))

  return (
    <div className="rounded-xl border border-amber-800/30 bg-amber-950/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Headphones size={14} className="text-amber-400" />
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Audios de pronunciación</span>
          <span className="text-xs text-amber-700">— opcional</span>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()}
          disabled={!!uploading}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-900/40 hover:bg-amber-800/40 text-amber-300 transition-colors disabled:opacity-40">
          {uploading ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
          Subir audio
        </button>
        <input ref={fileRef} type="file" className="hidden" accept=".mp3,.ogg,.wav,.aac,.m4a,audio/*"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      </div>

      {clips.length === 0 ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-2 py-4 rounded-lg border border-dashed border-amber-800/30 bg-amber-950/10 cursor-pointer hover:bg-amber-900/10 transition-all group"
        >
          <Headphones size={20} className="text-amber-700 group-hover:text-amber-500 transition-colors" />
          <p className="text-xs text-amber-700 group-hover:text-amber-500">Arrastra o haz clic para subir audios MP3/OGG/WAV</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clips.map((clip, i) => (
            <div key={clip.id} className="flex items-center gap-2 rounded-lg border border-amber-800/20 bg-amber-950/20 px-3 py-2">
              <Headphones size={13} className="text-amber-500 shrink-0" />
              <input
                type="text"
                value={clip.title}
                onChange={e => updateClip(i, 'title', e.target.value)}
                placeholder="Título del audio"
                className="flex-1 bg-transparent text-xs text-amber-200 placeholder:text-amber-700 focus:outline-none"
              />
              <input
                type="text"
                value={clip.description ?? ''}
                onChange={e => updateClip(i, 'description', e.target.value)}
                placeholder="Descripción (opcional)"
                className="flex-1 bg-transparent text-xs text-amber-400 placeholder:text-amber-700 focus:outline-none hidden sm:block"
              />
              <audio src={clip.url} controls className="h-6 w-28 shrink-0" />
              <button type="button" onClick={() => removeClip(i)}
                className="p-1 text-red-500 hover:text-red-400 transition-colors shrink-0">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Exercise Editor ──────────────────────────────────────────────────────────
const EXERCISE_TYPE_META: Record<string, { label: string; color: string; desc: string }> = {
  fill_blank: { label: 'Rellenar espacio', color: 'bg-verde-900/50 text-verde-300 border-verde-700/40', desc: 'El alumno escribe la respuesta correcta en un campo de texto' },
  choice:     { label: 'Opción múltiple', color: 'bg-blue-900/50 text-blue-300 border-blue-700/40',  desc: 'El alumno elige entre varias opciones (una o varias correctas)' },
  dialogue:   { label: 'Diálogo',         color: 'bg-purple-900/50 text-purple-300 border-purple-700/40', desc: 'El alumno completa los espacios de un diálogo' },
  free_write: { label: 'Escritura libre', color: 'bg-amber-900/50 text-amber-300 border-amber-700/40', desc: 'El alumno escribe libremente (sin verificación automática)' },
}

// Shared input style
const inp = 'w-full px-2.5 py-1.5 rounded-lg bg-verde-950/50 border border-verde-800/40 text-xs text-verde-200 focus:outline-none focus:border-verde-500 transition-colors placeholder:text-verde-700'
const inpSm = 'px-2 py-1 rounded-md bg-verde-950/50 border border-verde-800/40 text-xs text-verde-200 focus:outline-none focus:border-verde-500 transition-colors placeholder:text-verde-700'

// ── Fill Blank visual editor ──────────────────────────────────────────────────
function FillBlankForm({
  ex,
  onChange,
}: { ex: import('@/types').ExerciseFillBlank; onChange: (e: import('@/types').ExerciseFillBlank) => void }) {
  const addItem = () => onChange({ ...ex, items: [...ex.items, { id: `item_${Date.now()}`, label: '', answer: '', placeholder: '' }] })
  const delItem = (i: number) => onChange({ ...ex, items: ex.items.filter((_, idx) => idx !== i) })
  const updItem = (i: number, field: string, val: string) =>
    onChange({ ...ex, items: ex.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) })

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] text-verde-600 mb-1.5 font-semibold uppercase tracking-wide">Campos del ejercicio</p>
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 px-1 mb-0.5">
            <span className="text-[10px] text-verde-600">Etiqueta (ej: "La letra H")</span>
            <span className="text-[10px] text-verde-600">Respuesta correcta</span>
            <span className="text-[10px] text-verde-600">Texto guía (opcional)</span>
            <span />
          </div>
          {ex.items.map((item, i) => (
            <div key={item.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 items-center p-2 rounded-lg bg-verde-950/30 border border-verde-900/20">
              <input value={item.label} onChange={e => updItem(i, 'label', e.target.value)}
                placeholder="Etiqueta" className={inpSm} />
              <input value={item.answer} onChange={e => updItem(i, 'answer', e.target.value)}
                placeholder="Respuesta" className={inpSm} />
              <input value={item.placeholder ?? ''} onChange={e => updItem(i, 'placeholder', e.target.value)}
                placeholder="Pista" className={inpSm} />
              <button type="button" onClick={() => delItem(i)} className="text-red-500 hover:text-red-400 p-0.5"><X size={13} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem}
          className="mt-1.5 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-verde-900/30 hover:bg-verde-800/30 text-verde-400 transition-colors">
          <Plus size={11} /> Agregar campo
        </button>
      </div>
    </div>
  )
}

// ── Choice visual editor ──────────────────────────────────────────────────────
function ChoiceForm({
  ex,
  onChange,
}: { ex: import('@/types').ExerciseChoice; onChange: (e: import('@/types').ExerciseChoice) => void }) {
  const isGrouped = !!ex.questions && !ex.options
  const toggleMode = (grouped: boolean) => {
    if (grouped) onChange({ ...ex, options: undefined, questions: ex.questions ?? [{ id: `q_${Date.now()}`, text: '', options: [] }] })
    else onChange({ ...ex, questions: undefined, options: ex.options ?? [] })
  }
  const addFlatOpt = () => onChange({ ...ex, options: [...(ex.options ?? []), { value: `opción ${(ex.options?.length ?? 0) + 1}`, correct: false }] })
  const updFlatOpt = (i: number, field: string, val: unknown) =>
    onChange({ ...ex, options: (ex.options ?? []).map((o, idx) => idx === i ? { ...o, [field]: val } : o) })
  const delFlatOpt = (i: number) => onChange({ ...ex, options: (ex.options ?? []).filter((_, idx) => idx !== i) })

  const addQuestion = () => onChange({ ...ex, questions: [...(ex.questions ?? []), { id: `q_${Date.now()}`, text: '', options: [] }] })
  const updQuestion = (qi: number, field: string, val: unknown) =>
    onChange({ ...ex, questions: (ex.questions ?? []).map((q, idx) => idx === qi ? { ...q, [field]: val } : q) })
  const delQuestion = (qi: number) => onChange({ ...ex, questions: (ex.questions ?? []).filter((_, idx) => idx !== qi) })
  const addQOpt = (qi: number) => onChange({ ...ex, questions: (ex.questions ?? []).map((q, idx) => idx === qi ? { ...q, options: [...q.options, { value: '', correct: false }] } : q) })
  const updQOpt = (qi: number, oi: number, field: string, val: unknown) =>
    onChange({ ...ex, questions: (ex.questions ?? []).map((q, idx) => idx === qi ? { ...q, options: q.options.map((o, oidx) => oidx === oi ? { ...o, [field]: val } : o) } : q) })
  const delQOpt = (qi: number, oi: number) =>
    onChange({ ...ex, questions: (ex.questions ?? []).map((q, idx) => idx === qi ? { ...q, options: q.options.filter((_, oidx) => oidx !== oi) } : q) })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-verde-600 font-semibold uppercase tracking-wide">Modo:</span>
          <button type="button" onClick={() => toggleMode(false)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${!isGrouped ? 'bg-blue-900/50 text-blue-300 border-blue-700/40' : 'text-verde-500 border-verde-800/30 hover:text-verde-300'}`}>
            Una pregunta
          </button>
          <button type="button" onClick={() => toggleMode(true)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${isGrouped ? 'bg-blue-900/50 text-blue-300 border-blue-700/40' : 'text-verde-500 border-verde-800/30 hover:text-verde-300'}`}>
            Varias preguntas
          </button>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={!!ex.multiSelect}
            onChange={e => onChange({ ...ex, multiSelect: e.target.checked })}
            className="rounded accent-blue-500" />
          <span className="text-[11px] text-verde-400">Varias respuestas correctas</span>
        </label>
      </div>

      {!isGrouped && (
        <div>
          <p className="text-[10px] text-verde-600 mb-1.5 font-semibold uppercase tracking-wide">Opciones — marca cuál(es) son correctas</p>
          <div className="space-y-1.5">
            {(ex.options ?? []).map((opt, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${opt.correct ? 'border-green-700/50 bg-green-950/20' : 'border-verde-900/20 bg-verde-950/20'}`}>
                <button type="button" onClick={() => updFlatOpt(i, 'correct', !opt.correct)}
                  title="Marcar como correcta"
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${opt.correct ? 'border-green-500 bg-green-900/50 text-green-300' : 'border-verde-700/50 text-verde-700 hover:border-verde-500'}`}>
                  {opt.correct && <CheckCircle2 size={12} />}
                </button>
                <input value={opt.value} onChange={e => updFlatOpt(i, 'value', e.target.value)}
                  placeholder="Texto de la opción" className={`flex-1 ${inpSm}`} />
                <button type="button" onClick={() => delFlatOpt(i)} className="text-red-500 hover:text-red-400 p-0.5"><X size={13} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addFlatOpt}
            className="mt-1.5 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-verde-900/30 hover:bg-verde-800/30 text-verde-400 transition-colors">
            <Plus size={11} /> Agregar opción
          </button>
        </div>
      )}

      {isGrouped && (
        <div className="space-y-3">
          <p className="text-[10px] text-verde-600 font-semibold uppercase tracking-wide">Preguntas y opciones</p>
          {(ex.questions ?? []).map((q, qi) => (
            <div key={q.id} className="rounded-lg border border-verde-900/30 bg-verde-950/20 p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-verde-600 shrink-0">Pregunta {qi + 1}</span>
                <input value={q.text} onChange={e => updQuestion(qi, 'text', e.target.value)}
                  placeholder="Texto de la pregunta" className={`flex-1 ${inpSm}`} />
                <button type="button" onClick={() => delQuestion(qi)} className="text-red-500 hover:text-red-400 p-0.5"><X size={13} /></button>
              </div>
              <div className="pl-2 space-y-1">
                {q.options.map((opt, oi) => (
                  <div key={oi} className={`flex items-center gap-2 p-1.5 rounded-md border ${opt.correct ? 'border-green-700/40 bg-green-950/20' : 'border-verde-900/20'}`}>
                    <button type="button" onClick={() => updQOpt(qi, oi, 'correct', !opt.correct)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${opt.correct ? 'border-green-500 bg-green-900/50 text-green-300' : 'border-verde-700/50 text-verde-700 hover:border-verde-500'}`}>
                      {opt.correct && <CheckCircle2 size={10} />}
                    </button>
                    <input value={opt.value} onChange={e => updQOpt(qi, oi, 'value', e.target.value)}
                      placeholder="Opción" className={`flex-1 ${inpSm}`} />
                    <button type="button" onClick={() => delQOpt(qi, oi)} className="text-red-500 hover:text-red-400 p-0.5"><X size={11} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addQOpt(qi)}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-verde-900/30 hover:bg-verde-800/30 text-verde-500 transition-colors">
                  <Plus size={10} /> Opción
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addQuestion}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-verde-900/30 hover:bg-verde-800/30 text-verde-400 transition-colors">
            <Plus size={11} /> Agregar pregunta
          </button>
        </div>
      )}
    </div>
  )
}

// ── Dialogue visual editor ────────────────────────────────────────────────────
function DialogueForm({
  ex,
  onChange,
}: { ex: import('@/types').ExerciseDialogue; onChange: (e: import('@/types').ExerciseDialogue) => void }) {
  // Auto-detect blank ids from lines
  const detectBlanks = (lines: typeof ex.lines) => {
    const ids: string[] = []
    lines.forEach(l => { const matches = l.text.match(/___(\w+)___/g); if (matches) matches.forEach(m => { const id = m.slice(3, -3); if (!ids.includes(id)) ids.push(id) }) })
    return ids
  }
  const blankIds = detectBlanks(ex.lines)

  const addLine = () => onChange({ ...ex, lines: [...ex.lines, { speaker: '', text: '' }] })
  const updLine = (i: number, field: string, val: string) =>
    onChange({ ...ex, lines: ex.lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l) })
  const delLine = (i: number) => onChange({ ...ex, lines: ex.lines.filter((_, idx) => idx !== i) })
  const updAnswer = (id: string, val: string) => onChange({ ...ex, answers: { ...ex.answers, [id]: val } })
  const updWordBank = (val: string) => onChange({ ...ex, wordBank: val ? val.split(',').map(w => w.trim()).filter(Boolean) : undefined })

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-verde-600 font-semibold uppercase tracking-wide">Banco de palabras (opcional, separadas por coma)</label>
        <input
          value={(ex.wordBank ?? []).join(', ')}
          onChange={e => updWordBank(e.target.value)}
          placeholder="ciao, come, stai, bene..."
          className={`mt-1 ${inp}`}
        />
      </div>

      <div>
        <p className="text-[10px] text-verde-600 font-semibold uppercase tracking-wide mb-1">
          Líneas del diálogo — usa <code className="bg-verde-900/50 px-1 rounded">___id___</code> para crear espacios en blanco
        </p>
        <div className="space-y-1.5">
          {ex.lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[100px_1fr_auto] gap-1.5 items-center p-2 rounded-lg bg-purple-950/20 border border-purple-900/20">
              <input value={line.speaker} onChange={e => updLine(i, 'speaker', e.target.value)}
                placeholder="Personaje" className={inpSm} />
              <input value={line.text} onChange={e => updLine(i, 'text', e.target.value)}
                placeholder='Ej: Ciao! ___b1___ come stai?' className={inpSm} />
              <button type="button" onClick={() => delLine(i)} className="text-red-500 hover:text-red-400 p-0.5"><X size={13} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLine}
          className="mt-1.5 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-purple-900/30 hover:bg-purple-800/30 text-purple-400 transition-colors">
          <Plus size={11} /> Agregar línea
        </button>
      </div>

      {blankIds.length > 0 && (
        <div>
          <p className="text-[10px] text-verde-600 font-semibold uppercase tracking-wide mb-1">Respuestas correctas para cada espacio</p>
          <div className="space-y-1.5">
            {blankIds.map(id => (
              <div key={id} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/30 shrink-0">
                  ___{id}___
                </span>
                <span className="text-[10px] text-verde-600">→</span>
                <input value={ex.answers[id] ?? ''} onChange={e => updAnswer(id, e.target.value)}
                  placeholder="Respuesta correcta" className={`flex-1 ${inpSm}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Free Write visual editor ──────────────────────────────────────────────────
function FreeWriteForm({
  ex,
  onChange,
}: { ex: import('@/types').ExerciseFreeWrite; onChange: (e: import('@/types').ExerciseFreeWrite) => void }) {
  const addField = () => onChange({ ...ex, fields: [...ex.fields, { id: `f_${Date.now()}`, prefix: '', placeholder: '' }] })
  const updField = (i: number, field: string, val: string) =>
    onChange({ ...ex, fields: ex.fields.map((f, idx) => idx === i ? { ...f, [field]: val } : f) })
  const delField = (i: number) => onChange({ ...ex, fields: ex.fields.filter((_, idx) => idx !== i) })

  return (
    <div>
      <p className="text-[10px] text-verde-600 mb-1.5 font-semibold uppercase tracking-wide">Campos de escritura — como los verá el alumno</p>
      <div className="space-y-1.5">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 px-1 mb-0.5">
          <span className="text-[10px] text-verde-600">Prefijo (ej: "Mi chiamo")</span>
          <span className="text-[10px] text-verde-600">Texto guía en el campo</span>
          <span />
        </div>
        {ex.fields.map((f, i) => (
          <div key={f.id} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-center p-2 rounded-lg bg-amber-950/20 border border-amber-900/20">
            <input value={f.prefix} onChange={e => updField(i, 'prefix', e.target.value)}
              placeholder="Mi chiamo" className={inpSm} />
            <input value={f.placeholder} onChange={e => updField(i, 'placeholder', e.target.value)}
              placeholder="tu nombre..." className={inpSm} />
            <button type="button" onClick={() => delField(i)} className="text-red-500 hover:text-red-400 p-0.5"><X size={13} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addField}
        className="mt-1.5 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-amber-900/30 hover:bg-amber-800/30 text-amber-400 transition-colors">
        <Plus size={11} /> Agregar campo
      </button>
    </div>
  )
}

// ── Exercise form panel (shown when editing) ──────────────────────────────────
function ExerciseFormPanel({
  exercise,
  onSave,
  onCancel,
}: {
  exercise: Exercise
  onSave: (e: Exercise) => void
  onCancel: () => void
}) {
  const [local, setLocal] = useState<Exercise>({ ...exercise })

  const setBase = (field: string, val: unknown) => setLocal(e => ({ ...e, [field]: val } as Exercise))

  const changeType = (newType: Exercise['type']) => {
    if (newType === local.type) return
    const base = { id: local.id, number: local.number, title: local.title, instruction: local.instruction, section: local.section, answerPanel: local.answerPanel }
    if (newType === 'fill_blank') setLocal({ ...base, type: 'fill_blank', items: [] })
    else if (newType === 'choice') setLocal({ ...base, type: 'choice', multiSelect: false, options: [] })
    else if (newType === 'dialogue') setLocal({ ...base, type: 'dialogue', lines: [], answers: {} })
    else if (newType === 'free_write') setLocal({ ...base, type: 'free_write', fields: [] })
  }

  const answerPanelText = (local.answerPanel ?? []).join('\n')
  const setAnswerPanel = (txt: string) => setBase('answerPanel', txt ? txt.split('\n') : undefined)

  return (
    <div className="border-t border-verde-900/40 bg-verde-950/40 p-4 space-y-4">
      {/* Type selector */}
      <div>
        <p className="text-[10px] text-verde-600 font-semibold uppercase tracking-wide mb-1.5">Tipo de ejercicio</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(EXERCISE_TYPE_META).map(([type, meta]) => (
            <button key={type} type="button" onClick={() => changeType(type as Exercise['type'])}
              title={meta.desc}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${local.type === type ? meta.color : 'text-verde-600 border-verde-800/30 hover:text-verde-300 hover:border-verde-700/40'}`}>
              {meta.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-verde-700 mt-1">{EXERCISE_TYPE_META[local.type]?.desc}</p>
      </div>

      {/* Common fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-verde-600 font-semibold uppercase tracking-wide">Título del ejercicio</label>
          <input value={local.title} onChange={e => setBase('title', e.target.value)}
            placeholder="Ej: Completa las frases" className={`mt-1 ${inp}`} />
        </div>
        <div>
          <label className="text-[10px] text-verde-600 font-semibold uppercase tracking-wide">Sección (agrupa ejercicios visualmente)</label>
          <input value={local.section ?? ''} onChange={e => setBase('section', e.target.value || undefined)}
            placeholder="Ej: Parte 1 — Vocabulario" className={`mt-1 ${inp}`} />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-verde-600 font-semibold uppercase tracking-wide">Instrucción para el alumno</label>
        <textarea value={local.instruction} onChange={e => setBase('instruction', e.target.value)}
          placeholder="Ej: Completa los espacios con la palabra correcta." rows={2}
          className={`mt-1 ${inp} resize-none`} />
      </div>

      {/* Type-specific form */}
      <div className="rounded-xl border border-verde-900/30 bg-verde-950/20 p-3">
        {local.type === 'fill_blank' && (
          <FillBlankForm ex={local as import('@/types').ExerciseFillBlank} onChange={e => setLocal(e)} />
        )}
        {local.type === 'choice' && (
          <ChoiceForm ex={local as import('@/types').ExerciseChoice} onChange={e => setLocal(e)} />
        )}
        {local.type === 'dialogue' && (
          <DialogueForm ex={local as import('@/types').ExerciseDialogue} onChange={e => setLocal(e)} />
        )}
        {local.type === 'free_write' && (
          <FreeWriteForm ex={local as import('@/types').ExerciseFreeWrite} onChange={e => setLocal(e)} />
        )}
      </div>

      {/* Answer panel */}
      <div>
        <label className="text-[10px] text-verde-600 font-semibold uppercase tracking-wide">
          Clave de respuestas (una por línea — aparece al alumno al hacer clic en &quot;Ver respuestas&quot;)
        </label>
        <textarea value={answerPanelText} onChange={e => setAnswerPanel(e.target.value)}
          placeholder="Ej:&#10;La letra H = hotel&#10;La letra A = amore" rows={3}
          className={`mt-1 ${inp} resize-none`} />
      </div>

      <div className="flex gap-2 justify-end pt-1 border-t border-verde-900/30">
        <button type="button" onClick={onCancel}
          className="text-xs px-4 py-2 rounded-lg text-verde-500 hover:text-verde-300 border border-verde-900/30 hover:border-verde-700/30 transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={() => onSave(local)}
          className="text-xs px-4 py-2 rounded-lg bg-verde-700 hover:bg-verde-600 text-white font-semibold transition-colors flex items-center gap-1.5">
          <CheckCircle2 size={13} /> Guardar ejercicio
        </button>
      </div>
    </div>
  )
}

// ── Main exercise list ────────────────────────────────────────────────────────
function ExerciseEditor({
  exercises,
  onChange,
}: {
  exercises: Exercise[]
  onChange: (exercises: Exercise[]) => void
}) {
  const [editIdx, setEditIdx] = useState<number | null>(null)

  const closeEdit = () => setEditIdx(null)

  const saveExercise = (i: number, updated: Exercise) => {
    const arr = [...exercises]
    arr[i] = updated
    onChange(arr)
    closeEdit()
  }

  const deleteExercise = (i: number) => {
    onChange(exercises.filter((_, idx) => idx !== i))
    if (editIdx === i) closeEdit()
  }

  const moveUp = (i: number) => {
    if (i === 0) return
    const updated = [...exercises]
    ;[updated[i - 1], updated[i]] = [updated[i], updated[i - 1]]
    onChange(updated)
  }

  const moveDown = (i: number) => {
    if (i === exercises.length - 1) return
    const updated = [...exercises]
    ;[updated[i], updated[i + 1]] = [updated[i + 1], updated[i]]
    onChange(updated)
  }

  const addExercise = () => {
    const newEx: Exercise = {
      id: `ex_${Date.now()}`,
      number: exercises.length + 1,
      type: 'fill_blank',
      title: 'Nuevo ejercicio',
      instruction: '',
      items: [],
    } as Exercise
    onChange([...exercises, newEx])
    setEditIdx(exercises.length)
  }

  if (exercises.length === 0) return (
    <div className="rounded-xl border border-dashed border-verde-800/30 p-4 text-center">
      <ListOrdered size={20} className="mx-auto text-verde-700 mb-2" />
      <p className="text-xs text-verde-600 mb-3">Sin ejercicios. Importa un archivo o agrega manualmente.</p>
      <button type="button" onClick={addExercise}
        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-verde-900/40 hover:bg-verde-800/40 text-verde-300 transition-colors mx-auto">
        <Plus size={12} /> Agregar ejercicio
      </button>
    </div>
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered size={14} className="text-verde-500" />
          <span className="text-xs font-semibold text-verde-400 uppercase tracking-wide">
            Ejercicios ({exercises.length})
          </span>
        </div>
        <button type="button" onClick={addExercise}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-verde-900/40 hover:bg-verde-800/40 text-verde-300 transition-colors">
          <Plus size={11} /> Agregar
        </button>
      </div>

      <div className="space-y-1.5">
        {exercises.map((ex, i) => {
          const meta = EXERCISE_TYPE_META[ex.type] ?? EXERCISE_TYPE_META.fill_blank
          const isEditing = editIdx === i
          return (
            <div key={ex.id ?? i} className="rounded-xl border border-verde-900/30 bg-verde-950/20 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className="text-xs text-verde-700 shrink-0 w-5 font-mono">{i + 1}.</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${meta.color}`}>
                  {meta.label}
                </span>
                <span className="text-xs text-verde-300 truncate flex-1">{ex.title || '(sin título)'}</span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                    className="p-1 text-verde-600 hover:text-verde-400 disabled:opacity-30 transition-colors" title="Subir">
                    <ChevronUp size={13} />
                  </button>
                  <button type="button" onClick={() => moveDown(i)} disabled={i === exercises.length - 1}
                    className="p-1 text-verde-600 hover:text-verde-400 disabled:opacity-30 transition-colors" title="Bajar">
                    <ChevronDown size={13} />
                  </button>
                  <button type="button"
                    onClick={() => setEditIdx(isEditing ? null : i)}
                    className={`p-1 transition-colors ${isEditing ? 'text-verde-200' : 'text-verde-600 hover:text-verde-400'}`}
                    title="Editar">
                    <Pencil size={13} />
                  </button>
                  <button type="button" onClick={() => deleteExercise(i)}
                    className="p-1 text-red-600 hover:text-red-400 transition-colors" title="Eliminar">
                    <X size={13} />
                  </button>
                </div>
              </div>

              {isEditing && (
                <ExerciseFormPanel
                  exercise={ex}
                  onSave={updated => saveExercise(i, updated)}
                  onCancel={closeEdit}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Lesson Modal ─────────────────────────────────────────────────────────────
function LessonModal({
  lesson, onClose, onSave,
}: {
  lesson: LessonRow | null
  onClose: () => void
  onSave: (l: LessonRow) => void
}) {
  const [form, setForm] = useState<LessonFormData>(
    lesson ? {
      title: lesson.title,
      slug: lesson.slug,
      level: lesson.level,
      status: lesson.status,
      content_html: lesson.content_html,
      grammar_notes: lesson.grammar_notes,
      vocabulary: lesson.vocabulary ?? [],
      intro_video_url: lesson.intro_video_url ?? '',
      video_subtitles: { es: lesson.video_subtitles?.es ?? '', en: lesson.video_subtitles?.en ?? '', it: lesson.video_subtitles?.it ?? '' },
      exercises: lesson.exercises ?? [],
      audio_clips: lesson.audio_clips ?? [],
    } : emptyForm()
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [translations, setTranslations] = useState<LessonTranslations>(lesson?.translations ?? {})

  const setField = <K extends keyof LessonFormData>(k: K, v: LessonFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleTitleChange = (title: string) =>
    setForm(f => ({ ...f, title, slug: lesson ? f.slug : slugify(title) }))

  const addVocab = () =>
    setForm(f => ({ ...f, vocabulary: [...f.vocabulary, { word: '', translation: '', example: '' }] }))

  const updateVocab = (i: number, field: keyof VocabularyItem, val: string) =>
    setForm(f => ({ ...f, vocabulary: f.vocabulary.map((v, idx) => idx === i ? { ...v, [field]: val } : v) }))

  const removeVocab = (i: number) =>
    setForm(f => ({ ...f, vocabulary: f.vocabulary.filter((_, idx) => idx !== i) }))

  const handleImport = (data: Partial<LessonFormData>) => {
    setForm(f => ({
      ...f,
      title: data.title || f.title,
      slug: data.title ? slugify(data.title) : f.slug,
      level: (data.level as LessonLevel) || f.level,
      content_html: data.content_html || f.content_html,
      grammar_notes: data.grammar_notes || f.grammar_notes,
      vocabulary: data.vocabulary?.length ? data.vocabulary : f.vocabulary,
    }))
    setEditorKey(k => k + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const url = lesson ? `/api/admin/lessons/${lesson.id}` : '/api/admin/lessons'
      const method = lesson ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          level: form.level,
          status: form.status,
          content_html: form.content_html,
          grammar_notes: form.grammar_notes,
          vocabulary: form.vocabulary.filter(v => v.word.trim()),
          intro_video_url: form.intro_video_url || null,
          video_subtitles: {
            ...(form.video_subtitles.es && { es: form.video_subtitles.es }),
            ...(form.video_subtitles.en && { en: form.video_subtitles.en }),
            ...(form.video_subtitles.it && { it: form.video_subtitles.it }),
          },
          exercises: form.exercises,
          audio_clips: form.audio_clips,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      onSave(data.lesson); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl glass-dark rounded-2xl border border-verde-800/40 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-verde-800/30">
          <h3 className="text-lg font-bold text-verde-100 flex items-center gap-2">
            <FileText size={16} className="text-verde-400" />
            {lesson ? 'Editar lección' : 'Nueva lección'}
          </h3>
          <button onClick={onClose} className="text-verde-500 hover:text-verde-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── AI Import (lesson content) ── */}
          <ImportPanel onImport={handleImport} />

          {/* ── Translations (only when editing an existing lesson) ── */}
          {lesson && (
            <TranslationPanel
              lessonId={lesson.id}
              translations={translations}
              onUpdate={setTranslations}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Title (prominent) ── */}
            <div>
              <label className="block text-xs font-medium text-verde-400 mb-1.5">Título de la lección *</label>
              <input type="text" value={form.title} onChange={e => handleTitleChange(e.target.value)}
                placeholder="ej. I saluti italiani"
                className="w-full px-3 py-2.5 rounded-xl bg-verde-950/50 border border-verde-800/40 text-base text-verde-100 placeholder:text-verde-600 focus:outline-none focus:border-verde-600"
                required />
              {form.slug && (
                <p className="text-[10px] text-verde-700 mt-1 font-mono">/{form.slug}</p>
              )}
            </div>

            {/* ── Level + Status ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-verde-400 mb-1.5">Nivel</label>
                <select value={form.level} onChange={e => setField('level', e.target.value as LessonLevel)}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600">
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-verde-400 mb-1.5">Estado</label>
                <select value={form.status} onChange={e => setField('status', e.target.value as LessonStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600">
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
            </div>

            {/* ── Video + Subtitles ── */}
            <VideoSection
              videoUrl={form.intro_video_url}
              subtitles={form.video_subtitles}
              onChange={(url, subs) => setForm(f => ({ ...f, intro_video_url: url, video_subtitles: subs }))}
            />

            {/* ── Audio Clips ── */}
            <AudioSection
              clips={form.audio_clips}
              onChange={clips => setField('audio_clips', clips)}
            />

            {/* ── Rich Content Editor ── */}
            <div>
              <label className="block text-xs font-medium text-verde-400 mb-1.5">Contenuto della lezione</label>
              <RichEditor
                key={editorKey}
                value={form.content_html}
                onChange={v => setField('content_html', v)}
                placeholder="Escribe el contenido... usa la barra para dar formato e insertar imágenes."
              />
            </div>

            {/* Grammar Notes */}
            <div>
              <label className="block text-xs font-medium text-verde-400 mb-1.5">Note di grammatica</label>
              <textarea value={form.grammar_notes} onChange={e => setField('grammar_notes', e.target.value)}
                rows={3} placeholder="El verbo essere se conjuga: io sono, tu sei, lui/lei è..."
                className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 placeholder:text-verde-600 focus:outline-none focus:border-verde-600 resize-y" />
            </div>

            {/* Vocabulary */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-verde-400">
                  Vocabolario{form.vocabulary.length > 0 && <span className="ml-1.5 text-verde-600">({form.vocabulary.length})</span>}
                </label>
                <button type="button" onClick={addVocab}
                  className="flex items-center gap-1 text-xs text-verde-400 hover:text-verde-200 transition-colors">
                  <Plus size={12} /> Agregar palabra
                </button>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {form.vocabulary.map((v, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <GripVertical size={14} className="text-verde-700 shrink-0" />
                    {(['word', 'translation', 'example'] as const).map(field => (
                      <input key={field} type="text" value={v[field] ?? ''} onChange={e => updateVocab(i, field, e.target.value)}
                        placeholder={field === 'word' ? 'Parola' : field === 'translation' ? 'Traducción' : 'Ejemplo'}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-verde-950/50 border border-verde-800/40 text-xs text-verde-200 placeholder:text-verde-600 focus:outline-none focus:border-verde-600" />
                    ))}
                    <button type="button" onClick={() => removeVocab(i)}
                      className="p-1.5 text-red-500 hover:text-red-400 transition-colors shrink-0"><X size={13} /></button>
                  </div>
                ))}
                {form.vocabulary.length === 0 && (
                  <p className="text-xs text-verde-600 text-center py-3">Sin palabras. Importa un archivo o agrega manualmente.</p>
                )}
              </div>
            </div>

            {/* ── Exercise Guide Import ── */}
            <ExerciseImportPanel
              onImport={exercises => setField('exercises', exercises)}
              existingCount={form.exercises.length}
            />

            {/* ── Exercise Editor ── */}
            <ExerciseEditor
              exercises={form.exercises}
              onChange={exercises => setField('exercises', exercises)}
            />

            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : lesson ? 'Actualizar' : 'Crear lección'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Lesson Manager (main) ────────────────────────────────────────────────────
export function LessonManager() {
  const [lessons, setLessons] = useState<LessonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<LessonRow | null>(null)
  const [reordering, setReordering] = useState<string | null>(null)

  const fetchLessons = () => {
    setLoading(true)
    fetch('/api/admin/lessons')
      .then(r => r.json())
      .then(d => setLessons(d.lessons ?? []))
      .catch(err => console.error('Lessons fetch failed:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLessons() }, [])

  const openCreate = () => { setSelectedLesson(null); setShowModal(true) }
  const openEdit = (lesson: LessonRow) => { setSelectedLesson(lesson); setShowModal(true) }

  const handleSave = (lesson: LessonRow) => {
    setLessons(prev => {
      const idx = prev.findIndex(l => l.id === lesson.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = lesson; return next }
      return [...prev, lesson].sort((a, b) => a.order_index - b.order_index)
    })
  }

  const toggleStatus = async (lesson: LessonRow) => {
    const newStatus: LessonStatus = lesson.status === 'published' ? 'draft' : 'published'
    setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, status: newStatus } : l))
    try {
      await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, status: lesson.status } : l))
    }
  }

  const deleteLesson = async (id: string) => {
    if (!confirm('¿Eliminar esta lección?')) return
    setLessons(prev => prev.filter(l => l.id !== id))
    try { await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE' }) } catch { /* ignore */ }
  }

  const reorder = async (id: string, direction: 'up' | 'down') => {
    setReordering(id)
    try {
      await fetch('/api/admin/lessons/reorder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, direction }),
      })
      await fetchLessons()
    } catch { /* ignore */ } finally { setReordering(null) }
  }

  // Group by level, sorted by order_index within each level
  const grouped = LEVELS.reduce<Record<LessonLevel, LessonRow[]>>((acc, lvl) => {
    acc[lvl] = lessons.filter(l => l.level === lvl).sort((a, b) => a.order_index - b.order_index)
    return acc
  }, {} as Record<LessonLevel, LessonRow[]>)

  const filledLevels = LEVELS.filter(lvl => grouped[lvl].length > 0)

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {showModal && (
        <LessonModal lesson={selectedLesson} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-verde-50 flex items-center gap-2.5">
            <BookOpen size={24} className="text-verde-400" />
            Gestión de Lecciones
          </h1>
          <p className="text-sm text-verde-500 mt-0.5">
            {loading ? 'Cargando...' : `${lessons.length} lecciones · ${lessons.filter(l => l.status === 'published').length} publicadas`}
          </p>
        </div>
        <Button onClick={openCreate}><Plus size={15} /> Nueva lección</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-verde-600" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <BookOpen size={48} className="text-verde-800 mx-auto" />
          <p className="text-verde-600 text-sm">No hay lecciones aún. ¡Crea la primera!</p>
          <Button onClick={openCreate}><Plus size={15} /> Nueva lección</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filledLevels.map(level => (
            <div key={level} className="overflow-hidden rounded-2xl border border-verde-900/30">
              <div className={`px-4 py-2.5 flex items-center gap-2 border-b border-verde-900/30 bg-verde-950/40`}>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${LEVEL_COLORS[level]}`}>{level}</span>
                <span className="text-xs text-verde-500">{grouped[level].length} leccion{grouped[level].length !== 1 ? 'es' : ''}</span>
                <span className="text-[10px] text-verde-700 ml-1">— el orden aquí es el orden que ve el alumno</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-verde-900/20 bg-verde-950/20">
                    <th className="text-center px-3 py-2 text-xs font-semibold text-verde-600 uppercase tracking-wide w-12">#</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-verde-500 uppercase tracking-wide">Título</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-verde-500 uppercase tracking-wide hidden md:table-cell">Contenido</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-verde-500 uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-2 text-xs font-semibold text-verde-500 uppercase tracking-wide text-right">Orden · Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-verde-900/20">
                  {grouped[level].map((lesson, posIdx) => {
                    const levelLessons = grouped[level]
                    const isFirst = posIdx === 0
                    const isLast = posIdx === levelLessons.length - 1
                    const isMoving = reordering === lesson.id
                    return (
                      <tr key={lesson.id} className="hover:bg-verde-950/20 transition-colors">
                        {/* Sequence number */}
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-verde-900/40 border border-verde-800/30 text-xs font-black text-verde-300">
                            {posIdx + 1}
                          </span>
                        </td>
                        {/* Title */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-verde-200">{lesson.title}</div>
                          <div className="text-xs text-verde-600 font-mono mt-0.5">{lesson.slug}</div>
                        </td>
                        {/* Content indicators */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-2 flex-wrap">
                            {lesson.intro_video_url && (
                              <span title="Tiene video" className="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-950/30 border border-purple-800/20 px-1.5 py-0.5 rounded">
                                <Video size={11} /> Video
                              </span>
                            )}
                            {(lesson.exercises?.length ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-950/30 border border-blue-800/20 px-1.5 py-0.5 rounded">
                                <Dumbbell size={11} /> {lesson.exercises.length} ej.
                              </span>
                            )}
                            {(lesson.audio_clips?.length ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/30 border border-amber-800/20 px-1.5 py-0.5 rounded">
                                <Headphones size={11} /> {lesson.audio_clips!.length} audio
                              </span>
                            )}
                            {(lesson.vocabulary?.length ?? 0) > 0 && (
                              <span className="text-[10px] text-verde-600">{lesson.vocabulary!.length} vocab.</span>
                            )}
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <button onClick={() => toggleStatus(lesson)} className="flex items-center gap-1.5 group">
                            {lesson.status === 'published' ? (
                              <><ToggleRight size={16} className="text-verde-400" /><span className="text-xs text-verde-400 group-hover:text-verde-300">Publicado</span></>
                            ) : (
                              <><ToggleLeft size={16} className="text-verde-700" /><span className="text-xs text-verde-600 group-hover:text-verde-400">Borrador</span></>
                            )}
                          </button>
                        </td>
                        {/* Actions + reorder */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => reorder(lesson.id, 'up')}
                              disabled={isFirst || isMoving}
                              title="Subir en la secuencia"
                              className="p-1.5 rounded-lg text-verde-600 hover:text-verde-400 hover:bg-verde-900/30 disabled:opacity-20 transition-colors">
                              {isMoving ? <Loader2 size={13} className="animate-spin" /> : <ChevronUp size={13} />}
                            </button>
                            <button
                              onClick={() => reorder(lesson.id, 'down')}
                              disabled={isLast || isMoving}
                              title="Bajar en la secuencia"
                              className="p-1.5 rounded-lg text-verde-600 hover:text-verde-400 hover:bg-verde-900/30 disabled:opacity-20 transition-colors">
                              <ChevronDown size={13} />
                            </button>
                            <div className="w-px h-4 bg-verde-900/40 mx-0.5" />
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(lesson)} title="Editar">
                              <Pencil size={13} className="text-verde-500" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => deleteLesson(lesson.id)} title="Eliminar">
                              <Trash2 size={13} className="text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
