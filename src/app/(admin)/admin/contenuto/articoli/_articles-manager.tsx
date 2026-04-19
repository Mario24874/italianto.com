'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Info, Loader2, X, ToggleLeft, ToggleRight, ImageIcon, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadToStorage } from '@/lib/upload'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const PLANS = ['free', 'essenziale', 'avanzato', 'maestro']
const CATEGORIES = ['cultura', 'gastronomia', 'viajes', 'historia', 'arte', 'tradiciones', 'idioma']
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300', A2: 'bg-green-900/50 text-green-300',
  B1: 'bg-yellow-900/50 text-yellow-300', B2: 'bg-orange-900/50 text-orange-300',
  C1: 'bg-red-900/50 text-red-300', C2: 'bg-purple-900/50 text-purple-300',
}

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

interface Article { id: string; slug: string; title: string; excerpt: string; content_html: string; image_url: string | null; category: string; level: string; plan_required: string; status: string; order_index: number }
type FormData = Omit<Article, 'id'> & { id?: string }
const empty = (): FormData => ({ slug: '', title: '', excerpt: '', content_html: '', image_url: '', category: 'cultura', level: 'A1', plan_required: 'free', status: 'draft', order_index: 0 })

export function ArticlesManager() {
  const [items, setItems] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormData | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/info-articles')
    const { data } = await res.json()
    setItems(data ?? [])
    setLoading(false)
  }

  async function save() {
    if (!form?.title.trim()) { toast.error('El título es obligatorio'); return }
    setSaving(true)
    const payload = { ...form, slug: form.slug || slugify(form.title), image_url: form.image_url || null }
    const res = form.id
      ? await fetch(`/api/admin/info-articles/${form.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/admin/info-articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) { toast.success('Guardado'); setForm(null); load() }
    else { const e = await res.json(); toast.error(e.error ?? 'Error') }
    setSaving(false)
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar?')) return
    if ((await fetch(`/api/admin/info-articles/${id}`, { method: 'DELETE' })).ok) { toast.success('Eliminado'); load() }
  }

  async function toggleStatus(item: Article) {
    const status = item.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/admin/info-articles/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i))
  }

  async function handleImageFile(file: File) {
    setUploadingImage(true)
    try {
      const url = await uploadToStorage(file, 'articles')
      setForm(f => f ? { ...f, image_url: url } : f)
      toast.success('Imagen subida correctamente')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al subir imagen')
    } finally {
      setUploadingImage(false)
      if (imageRef.current) imageRef.current.value = ''
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Info size={22} className="text-blue-400" />
          <h1 className="text-2xl font-extrabold text-verde-50">Articoli</h1>
          <span className="text-xs text-verde-600 bg-verde-950/40 border border-verde-900/30 px-2 py-1 rounded-lg">{items.length} articoli</span>
        </div>
        <button onClick={() => setForm(empty())} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors">
          <Plus size={16} /> Nuevo artículo
        </button>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-bg-dark border border-verde-800/40 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-verde-900/30">
              <h2 className="text-lg font-bold text-verde-100">{form.id ? 'Editar' : 'Nuevo'} artículo</h2>
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
                  <label className="block text-xs text-verde-500 mb-1">Categoría</label>
                  <select value={form.category} onChange={e => setForm(f => f ? { ...f, category: e.target.value } : f)}
                    className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none capitalize">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
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

                {/* Image Upload */}
                <div>
                  <label className="block text-xs text-verde-500 mb-1">Imagen</label>
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.svg"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }}
                  />
                  <div className="flex items-center gap-2">
                    {form.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.image_url}
                        alt="preview"
                        className="w-10 h-10 rounded-lg object-cover border border-verde-800/40 shrink-0"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => imageRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-300 text-xs hover:border-verde-600 hover:text-verde-200 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {uploadingImage
                        ? <Loader2 size={13} className="animate-spin" />
                        : form.image_url
                          ? <CheckCircle2 size={13} className="text-verde-400" />
                          : <ImageIcon size={13} />}
                      {uploadingImage ? 'Subiendo...' : form.image_url ? 'Cambiar' : 'Subir imagen'}
                    </button>
                  </div>
                  <input
                    value={form.image_url ?? ''}
                    onChange={e => setForm(f => f ? { ...f, image_url: e.target.value } : f)}
                    placeholder="o pega URL de imagen..."
                    className="mt-2 w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none focus:border-verde-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-verde-500 mb-1">Extracto</label>
                <textarea value={form.excerpt} onChange={e => setForm(f => f ? { ...f, excerpt: e.target.value } : f)} rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs text-verde-500 mb-1">Contenido</label>
                <textarea value={form.content_html} onChange={e => setForm(f => f ? { ...f, content_html: e.target.value } : f)} rows={8}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-verde-900/30">
              <button onClick={save} disabled={saving || uploadingImage} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white font-semibold text-sm disabled:opacity-50">
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
        <div className="text-center py-20 text-verde-600"><Info size={36} className="mx-auto mb-3 text-verde-800" /><p>No hay artículos todavía</p></div>
      ) : (
        <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-verde-900/30">{['Título', 'Categoría', 'Nivel', 'Estado', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-verde-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-verde-900/10">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-verde-950/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-verde-900/30 shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-verde-200">{item.title}</div>
                        <div className="text-xs text-verde-500 truncate max-w-[220px]">{item.excerpt}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-blue-400 capitalize">{item.category}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${LEVEL_COLORS[item.level]}`}>{item.level}</span></td>
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
