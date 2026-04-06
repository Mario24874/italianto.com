'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  BookOpen, Plus, Pencil, Trash2, Loader2, X,
  ToggleLeft, ToggleRight, GripVertical,
  Upload, FileText, Sparkles, AlertTriangle,
} from 'lucide-react'
import type { LessonRow, LessonLevel, LessonStatus, VocabularyItem } from '@/types'
import type { PlanType } from '@/lib/plans'
import { RichEditor } from './_rich-editor'

const LEVELS: LessonLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const PLANS: { value: PlanType; label: string }[] = [
  { value: 'free', label: 'Gratis' },
  { value: 'essenziale', label: 'Essenziale' },
  { value: 'avanzato', label: 'Avanzato' },
  { value: 'maestro', label: 'Maestro' },
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
  order_index: number
  plan_required: PlanType
  status: LessonStatus
  content_html: string
  grammar_notes: string
  vocabulary: VocabularyItem[]
}

const emptyForm = (): LessonFormData => ({
  title: '',
  slug: '',
  level: 'A1',
  order_index: 0,
  plan_required: 'free',
  status: 'draft',
  content_html: '',
  grammar_notes: '',
  vocabulary: [],
})

// ─── File Import Panel ────────────────────────────────────────────────────────
function ImportPanel({ onImport }: { onImport: (data: Partial<LessonFormData>) => void }) {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const ext = file.name.toLowerCase()
    const valid = allowed.includes(file.type) || ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.txt') || ext.endsWith('.md')

    if (!valid) {
      setError('Formato no soportado. Usa PDF, DOCX o TXT.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('El archivo es muy grande. Máximo 15 MB.')
      return
    }

    setFileName(file.name)
    setImporting(true)
    setError(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/admin/lessons/import', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al importar')
      onImport(data.lesson)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al importar')
    } finally {
      setImporting(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="rounded-xl border border-dashed border-verde-700/50 bg-verde-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-verde-400" />
        <span className="text-xs font-semibold text-verde-300 uppercase tracking-wide">
          Importar con IA
        </span>
        <span className="text-xs text-verde-600">— PDF, DOCX o TXT</span>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center gap-2 py-5 rounded-lg border border-verde-800/30 bg-verde-950/30
          cursor-pointer hover:bg-verde-900/20 hover:border-verde-700/50 transition-all group"
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

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
            <div className="text-center">
              <p className="text-sm text-verde-400 group-hover:text-verde-300 transition-colors">
                Arrastra un archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-verde-600 mt-0.5">
                Gemini leerá el archivo y rellenará todos los campos automáticamente
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
          <AlertTriangle size={13} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

// ─── Lesson Modal ─────────────────────────────────────────────────────────────
function LessonModal({
  lesson,
  onClose,
  onSave,
}: {
  lesson: LessonRow | null
  onClose: () => void
  onSave: (l: LessonRow) => void
}) {
  const [form, setForm] = useState<LessonFormData>(
    lesson
      ? {
          title: lesson.title,
          slug: lesson.slug,
          level: lesson.level,
          order_index: lesson.order_index,
          plan_required: lesson.plan_required,
          status: lesson.status,
          content_html: lesson.content_html,
          grammar_notes: lesson.grammar_notes,
          vocabulary: lesson.vocabulary ?? [],
        }
      : emptyForm()
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Key to force RichEditor to re-mount with new content after import
  const [editorKey, setEditorKey] = useState(0)

  const setField = <K extends keyof LessonFormData>(k: K, v: LessonFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleTitleChange = (title: string) => {
    setForm(f => ({ ...f, title, slug: lesson ? f.slug : slugify(title) }))
  }

  const addVocab = () =>
    setForm(f => ({ ...f, vocabulary: [...f.vocabulary, { word: '', translation: '', example: '' }] }))

  const updateVocab = (i: number, field: keyof VocabularyItem, val: string) =>
    setForm(f => ({
      ...f,
      vocabulary: f.vocabulary.map((v, idx) => idx === i ? { ...v, [field]: val } : v),
    }))

  const removeVocab = (i: number) =>
    setForm(f => ({ ...f, vocabulary: f.vocabulary.filter((_, idx) => idx !== i) }))

  // Called when AI import returns data
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
    // Force RichEditor to re-render with new content
    setEditorKey(k => k + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const url = lesson ? `/api/admin/lessons/${lesson.id}` : '/api/admin/lessons'
      const method = lesson ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vocabulary: form.vocabulary.filter(v => v.word.trim()),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      onSave(data.lesson)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
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
          {/* ── Import panel (only for new lessons) ── */}
          {!lesson && (
            <ImportPanel onImport={handleImport} />
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title + Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-verde-400 mb-1.5">Titolo *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="es. I saluti italiani"
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 placeholder:text-verde-600 focus:outline-none focus:border-verde-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-verde-400 mb-1.5">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setField('slug', e.target.value)}
                  placeholder="i-saluti-italiani"
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 font-mono placeholder:text-verde-600 focus:outline-none focus:border-verde-600"
                  required
                />
              </div>
            </div>

            {/* Level + Plan + Status + Order */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-verde-400 mb-1.5">Livello</label>
                <select
                  value={form.level}
                  onChange={e => setField('level', e.target.value as LessonLevel)}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600"
                >
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-verde-400 mb-1.5">Plan</label>
                <select
                  value={form.plan_required}
                  onChange={e => setField('plan_required', e.target.value as PlanType)}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600"
                >
                  {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-verde-400 mb-1.5">Estado</label>
                <select
                  value={form.status}
                  onChange={e => setField('status', e.target.value as LessonStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600"
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-verde-400 mb-1.5">Orden</label>
                <input
                  type="number"
                  value={form.order_index}
                  onChange={e => setField('order_index', Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600"
                />
              </div>
            </div>

            {/* ── Rich Content Editor ── */}
            <div>
              <label className="block text-xs font-medium text-verde-400 mb-1.5">
                Contenuto della lezione
              </label>
              <RichEditor
                key={editorKey}
                value={form.content_html}
                onChange={v => setField('content_html', v)}
                placeholder="Scrivi il contenuto della lezione... Usa la barra de herramientas para dar formato."
              />
            </div>

            {/* Grammar Notes */}
            <div>
              <label className="block text-xs font-medium text-verde-400 mb-1.5">Note di grammatica</label>
              <textarea
                value={form.grammar_notes}
                onChange={e => setField('grammar_notes', e.target.value)}
                rows={3}
                placeholder="El verbo essere se conjuga: io sono, tu sei, lui/lei è..."
                className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 placeholder:text-verde-600 focus:outline-none focus:border-verde-600 resize-y"
              />
            </div>

            {/* Vocabulary */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-verde-400">
                  Vocabolario
                  {form.vocabulary.length > 0 && (
                    <span className="ml-1.5 text-verde-600">({form.vocabulary.length} parole)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={addVocab}
                  className="flex items-center gap-1 text-xs text-verde-400 hover:text-verde-200 transition-colors"
                >
                  <Plus size={12} /> Agregar palabra
                </button>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {form.vocabulary.map((v, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <GripVertical size={14} className="text-verde-700 shrink-0" />
                    <input
                      type="text"
                      value={v.word}
                      onChange={e => updateVocab(i, 'word', e.target.value)}
                      placeholder="Parola"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-verde-950/50 border border-verde-800/40 text-xs text-verde-200 placeholder:text-verde-600 focus:outline-none focus:border-verde-600"
                    />
                    <input
                      type="text"
                      value={v.translation}
                      onChange={e => updateVocab(i, 'translation', e.target.value)}
                      placeholder="Traducción"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-verde-950/50 border border-verde-800/40 text-xs text-verde-200 placeholder:text-verde-600 focus:outline-none focus:border-verde-600"
                    />
                    <input
                      type="text"
                      value={v.example ?? ''}
                      onChange={e => updateVocab(i, 'example', e.target.value)}
                      placeholder="Ejemplo"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-verde-950/50 border border-verde-800/40 text-xs text-verde-200 placeholder:text-verde-600 focus:outline-none focus:border-verde-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeVocab(i)}
                      className="p-1.5 text-red-500 hover:text-red-400 transition-colors shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                {form.vocabulary.length === 0 && (
                  <p className="text-xs text-verde-600 text-center py-3">
                    Sin palabras. Importa un archivo o agrega manualmente.
                  </p>
                )}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving
                  ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                  : lesson ? 'Actualizar' : 'Crear lección'}
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

  useEffect(() => {
    fetch('/api/admin/lessons')
      .then(r => r.json())
      .then(d => setLessons(d.lessons ?? []))
      .catch(err => console.error('Lessons fetch failed:', err))
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => { setSelectedLesson(null); setShowModal(true) }
  const openEdit = (lesson: LessonRow) => { setSelectedLesson(lesson); setShowModal(true) }

  const handleSave = (lesson: LessonRow) => {
    setLessons(prev => {
      const idx = prev.findIndex(l => l.id === lesson.id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = lesson; return next
      }
      return [lesson, ...prev]
    })
  }

  const toggleStatus = async (lesson: LessonRow) => {
    const newStatus: LessonStatus = lesson.status === 'published' ? 'draft' : 'published'
    setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, status: newStatus } : l))
    try {
      await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, updated_at: new Date().toISOString() }),
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

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {showModal && (
        <LessonModal
          lesson={selectedLesson}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-verde-50 flex items-center gap-2.5">
            <BookOpen size={24} className="text-verde-400" />
            Gestión de Lecciones
          </h1>
          <p className="text-sm text-verde-500 mt-0.5">
            {loading
              ? 'Cargando...'
              : `${lessons.length} lecciones · ${lessons.filter(l => l.status === 'published').length} publicadas`}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} />
          Nueva lección
        </Button>
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
        <div className="overflow-hidden rounded-2xl border border-verde-900/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-verde-900/30 bg-verde-950/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide hidden sm:table-cell">Nivel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide hidden md:table-cell">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide hidden lg:table-cell">Orden</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-verde-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-verde-900/20">
              {lessons.map(lesson => (
                <tr key={lesson.id} className="hover:bg-verde-950/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-verde-200">{lesson.title}</div>
                    <div className="text-xs text-verde-600 font-mono">{lesson.slug}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${LEVEL_COLORS[lesson.level]}`}>
                      {lesson.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-verde-500 capitalize">{lesson.plan_required}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-verde-600">{lesson.order_index}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(lesson)} className="flex items-center gap-1.5 group">
                      {lesson.status === 'published' ? (
                        <>
                          <ToggleRight size={16} className="text-verde-400" />
                          <span className="text-xs text-verde-400 group-hover:text-verde-300">Publicado</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={16} className="text-verde-700" />
                          <span className="text-xs text-verde-600 group-hover:text-verde-400">Borrador</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(lesson)} title="Editar">
                        <Pencil size={13} className="text-verde-500" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteLesson(lesson.id)} title="Eliminar">
                        <Trash2 size={13} className="text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
