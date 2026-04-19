'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Gamepad2, Loader2, X, ToggleLeft, ToggleRight, Upload, CheckCircle2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { uploadToStorage } from '@/lib/upload'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const PLANS = ['free', 'essenziale', 'avanzato', 'maestro']
const TYPES = ['game', 'quiz', 'puzzle', 'crossword', 'wordmatch']
const TYPE_LABELS: Record<string, string> = { game: 'Juego', quiz: 'Quiz', puzzle: 'Puzzle', crossword: 'Crucigrama', wordmatch: 'Palabras' }
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300', A2: 'bg-green-900/50 text-green-300',
  B1: 'bg-yellow-900/50 text-yellow-300', B2: 'bg-orange-900/50 text-orange-300',
  C1: 'bg-red-900/50 text-red-300', C2: 'bg-purple-900/50 text-purple-300',
}

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

interface Activity { id: string; slug: string; title: string; description: string; type: string; content: string; file_url: string | null; level: string; plan_required: string; status: string; order_index: number }
type FormData = Omit<Activity, 'id'> & { id?: string }
const empty = (): FormData => ({ slug: '', title: '', description: '', type: 'game', content: '', file_url: null, level: 'A1', plan_required: 'free', status: 'draft', order_index: 0 })

export function ActivitiesManager() {
  const [items, setItems] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormData | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/activities')
    const { data } = await res.json()
    setItems(data ?? [])
    setLoading(false)
  }

  async function save() {
    if (!form?.title.trim()) { toast.error('El título es obligatorio'); return }
    setSaving(true)
    const payload = { ...form, slug: form.slug || slugify(form.title), file_url: form.file_url || null }
    const res = form.id
      ? await fetch(`/api/admin/activities/${form.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/admin/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) { toast.success('Guardado'); setForm(null); load() }
    else { const e = await res.json(); toast.error(e.error ?? 'Error') }
    setSaving(false)
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar?')) return
    if ((await fetch(`/api/admin/activities/${id}`, { method: 'DELETE' })).ok) { toast.success('Eliminada'); load() }
  }

  async function toggleStatus(item: Activity) {
    const status = item.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/admin/activities/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i))
  }

  async function handleFile(file: File) {
    setUploading(true)
    setUploadProgress(0)
    setUploadedFileName(null)
    try {
      const url = await uploadToStorage(file, 'activities', (pct) => setUploadProgress(pct))
      setUploadedFileName(file.name)
      setForm(f => f ? { ...f, file_url: url } : f)
      toast.success('Archivo subido correctamente')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al subir archivo')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function openForm(item?: Activity) {
    setUploadedFileName(null)
    setForm(item ? { ...item } : empty())
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 size={22} className="text-amber-400" />
          <h1 className="text-2xl font-extrabold text-verde-50">Attività</h1>
          <span className="text-xs text-verde-600 bg-verde-950/40 border border-verde-900/30 px-2 py-1 rounded-lg">{items.length} attività</span>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors">
          <Plus size={16} /> Nueva actividad
        </button>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-bg-dark border border-verde-800/40 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-verde-900/30">
              <h2 className="text-lg font-bold text-verde-100">{form.id ? 'Editar' : 'Nueva'} actividad</h2>
              <button onClick={() => setForm(null)} className="text-verde-600 hover:text-verde-300"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs text-verde-500 mb-1">Título *</label>
                <input value={form.title} onChange={e => setForm(f => f ? { ...f, title: e.target.value, slug: f.id ? f.slug : slugify(e.target.value) } : f)}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none focus:border-verde-600" />
              </div>
              <div>
                <label className="block text-xs text-verde-500 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => f ? { ...f, description: e.target.value } : f)} rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none focus:border-verde-600 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-verde-500 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => f ? { ...f, type: e.target.value } : f)}
                    className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none">
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-verde-500 mb-1">Nivel</label>
                  <select value={form.level} onChange={e => setForm(f => f ? { ...f, level: e.target.value } : f)}
                    className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-verde-500 mb-1">Plan</label>
                  <select value={form.plan_required} onChange={e => setForm(f => f ? { ...f, plan_required: e.target.value } : f)}
                    className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none capitalize">
                    {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs text-verde-500 mb-2">Archivo adjunto (PDF u otros)</label>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragOver(false)
                    const f = e.dataTransfer.files[0]
                    if (f) handleFile(f)
                  }}
                  onClick={() => !uploading && fileRef.current?.click()}
                  className={`rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                    dragOver
                      ? 'border-amber-500 bg-amber-950/20'
                      : 'border-verde-800/40 bg-verde-950/20 hover:border-verde-700/60 hover:bg-verde-950/30'
                  } ${uploading ? 'pointer-events-none' : ''}`}
                >
                  <div className="flex flex-col items-center justify-center py-5 gap-1.5">
                    {uploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin text-amber-400" />
                        <span className="text-xs text-verde-400">Subiendo... {uploadProgress}%</span>
                        <div className="w-full max-w-xs px-4 mt-1">
                          <div className="h-1.5 rounded-full bg-verde-900/60 overflow-hidden">
                            <div className="h-full bg-verde-500 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      </>
                    ) : uploadedFileName || (form.file_url && form.file_url.startsWith('http')) ? (
                      <>
                        <CheckCircle2 size={20} className="text-verde-400" />
                        <span className="text-xs text-verde-300 font-medium">{uploadedFileName ?? 'Archivo vinculado'}</span>
                        {form.file_url && (
                          <a
                            href={form.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-verde-600 hover:text-verde-400 transition-colors"
                          >
                            <ExternalLink size={11} /> Ver archivo
                          </a>
                        )}
                        <span className="text-xs text-verde-700">Haz clic para reemplazar</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-verde-700" />
                        <span className="text-xs text-verde-500">Arrastra un archivo o haz clic para seleccionar</span>
                      </>
                    )}
                  </div>
                </div>
                {form.file_url && !uploadedFileName && (
                  <button
                    type="button"
                    onClick={() => setForm(f => f ? { ...f, file_url: null } : f)}
                    className="mt-1 text-xs text-red-500 hover:text-red-400 transition-colors"
                  >
                    Quitar archivo
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-verde-900/30">
              <button onClick={save} disabled={saving || uploading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white font-semibold text-sm disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />} {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setForm(null)} className="px-5 py-2.5 rounded-xl border border-verde-800/40 text-verde-400 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-verde-600" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-verde-600"><Gamepad2 size={36} className="mx-auto mb-3 text-verde-800" /><p>No hay actividades todavía</p></div>
      ) : (
        <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-verde-900/30">{['Título', 'Tipo', 'Nivel', 'Plan', 'Estado', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-verde-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-verde-900/10">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-verde-950/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-verde-200">{item.title}</div>
                      {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-400 transition-colors" title="Archivo adjunto">
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-verde-500 truncate max-w-[200px]">{item.description}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-amber-400">{TYPE_LABELS[item.type] ?? item.type}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${LEVEL_COLORS[item.level]}`}>{item.level}</span></td>
                  <td className="px-4 py-3 text-xs text-verde-400 capitalize">{item.plan_required}</td>
                  <td className="px-4 py-3"><button onClick={() => toggleStatus(item)} className="flex items-center gap-1 text-xs">{item.status === 'published' ? <><ToggleRight size={15} className="text-verde-400" /><span className="text-verde-400">Pub</span></> : <><ToggleLeft size={15} className="text-verde-700" /><span className="text-verde-600">Draft</span></>}</button></td>
                  <td className="px-4 py-3"><div className="flex gap-2 justify-end"><button onClick={() => openForm(item)} className="p-1.5 text-verde-600 hover:text-verde-300"><Pencil size={13} /></button><button onClick={() => del(item.id)} className="p-1.5 text-red-700 hover:text-red-400"><Trash2 size={13} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
