'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Download, Loader2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'all']
const PLANS = ['free', 'essenziale', 'avanzato', 'maestro']
const FILE_TYPES = ['pdf', 'audio', 'video', 'zip', 'image', 'doc']
const FILE_TYPE_LABELS: Record<string, string> = { pdf: 'PDF', audio: 'Audio', video: 'Video', zip: 'ZIP', image: 'Imagen', doc: 'Documento' }

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

interface Download { id: string; slug: string; title: string; description: string; file_url: string; file_type: string; file_size_kb: number | null; level: string; plan_required: string; status: string; order_index: number }
type FormData = Omit<Download, 'id'> & { id?: string }
const empty = (): FormData => ({ slug: '', title: '', description: '', file_url: '', file_type: 'pdf', file_size_kb: null, level: 'all', plan_required: 'free', status: 'draft', order_index: 0 })

export function DownloadsManager() {
  const [items, setItems] = useState<Download[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormData | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/downloads')
    const { data } = await res.json()
    setItems(data ?? [])
    setLoading(false)
  }

  async function save() {
    if (!form?.title.trim()) { toast.error('El título es obligatorio'); return }
    if (!form?.file_url.trim()) { toast.error('La URL del archivo es obligatoria'); return }
    setSaving(true)
    const payload = { ...form, slug: form.slug || slugify(form.title) }
    const res = form.id
      ? await fetch(`/api/admin/downloads/${form.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/admin/downloads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) { toast.success('Guardado'); setForm(null); load() }
    else { const e = await res.json(); toast.error(e.error ?? 'Error') }
    setSaving(false)
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar?')) return
    if ((await fetch(`/api/admin/downloads/${id}`, { method: 'DELETE' })).ok) { toast.success('Eliminado'); load() }
  }

  async function toggleStatus(item: Download) {
    const status = item.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/admin/downloads/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download size={22} className="text-cyan-400" />
          <h1 className="text-2xl font-extrabold text-verde-50">Downloads</h1>
          <span className="text-xs text-verde-600 bg-verde-950/40 border border-verde-900/30 px-2 py-1 rounded-lg">{items.length} archivos</span>
        </div>
        <button onClick={() => setForm(empty())} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors">
          <Plus size={16} /> Nuevo archivo
        </button>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-bg-dark border border-verde-800/40 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-verde-900/30">
              <h2 className="text-lg font-bold text-verde-100">{form.id ? 'Editar' : 'Nuevo'} archivo</h2>
              <button onClick={() => setForm(null)} className="text-verde-600 hover:text-verde-300"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-verde-500 mb-1">Título *</label>
                  <input value={form.title} onChange={e => setForm(f => f ? { ...f, title: e.target.value, slug: f.id ? f.slug : slugify(e.target.value) } : f)}
                    className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none focus:border-verde-600" />
                </div>
                <div>
                  <label className="block text-xs text-verde-500 mb-1">Tipo de archivo</label>
                  <select value={form.file_type} onChange={e => setForm(f => f ? { ...f, file_type: e.target.value } : f)}
                    className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none">
                    {FILE_TYPES.map(t => <option key={t} value={t}>{FILE_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-verde-500 mb-1">URL del archivo *</label>
                  <input value={form.file_url} onChange={e => setForm(f => f ? { ...f, file_url: e.target.value } : f)}
                    placeholder="https://..." className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:col-span-2">
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
                  <div>
                    <label className="block text-xs text-verde-500 mb-1">Tamaño (KB)</label>
                    <input type="number" value={form.file_size_kb ?? ''} onChange={e => setForm(f => f ? { ...f, file_size_kb: e.target.value ? Number(e.target.value) : null } : f)}
                      className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-verde-500 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => f ? { ...f, description: e.target.value } : f)} rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-verde-900/30">
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white font-semibold text-sm disabled:opacity-50">
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
        <div className="text-center py-20 text-verde-600"><Download size={36} className="mx-auto mb-3 text-verde-800" /><p>No hay archivos todavía</p></div>
      ) : (
        <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-verde-900/30">{['Título', 'Tipo', 'Nivel', 'Plan', 'Estado', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-verde-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-verde-900/10">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-verde-950/20">
                  <td className="px-4 py-3"><div className="font-medium text-verde-200">{item.title}</div><div className="text-xs text-verde-500 truncate max-w-[200px]">{item.description}</div></td>
                  <td className="px-4 py-3 text-xs text-cyan-400">{FILE_TYPE_LABELS[item.file_type] ?? item.file_type}</td>
                  <td className="px-4 py-3 text-xs text-verde-400">{item.level}</td>
                  <td className="px-4 py-3 text-xs text-verde-400 capitalize">{item.plan_required}</td>
                  <td className="px-4 py-3"><button onClick={() => toggleStatus(item)} className="flex items-center gap-1 text-xs">{item.status === 'published' ? <><ToggleRight size={15} className="text-verde-400" /><span className="text-verde-400">Pub</span></> : <><ToggleLeft size={15} className="text-verde-700" /><span className="text-verde-600">Draft</span></>}</button></td>
                  <td className="px-4 py-3"><div className="flex gap-2 justify-end"><button onClick={() => setForm({ ...item })} className="p-1.5 text-verde-600 hover:text-verde-300"><Pencil size={13} /></button><button onClick={() => del(item.id)} className="p-1.5 text-red-700 hover:text-red-400"><Trash2 size={13} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
