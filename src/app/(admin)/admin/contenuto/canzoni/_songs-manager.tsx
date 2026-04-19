'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Music, Loader2, X, ToggleLeft, ToggleRight, Paperclip, CheckCircle2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { uploadToStorage } from '@/lib/upload'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const PLANS = ['free', 'essenziale', 'avanzato', 'maestro']
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300', A2: 'bg-green-900/50 text-green-300',
  B1: 'bg-yellow-900/50 text-yellow-300', B2: 'bg-orange-900/50 text-orange-300',
  C1: 'bg-red-900/50 text-red-300', C2: 'bg-purple-900/50 text-purple-300',
}

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

interface Song { id: string; slug: string; title: string; artist: string; lyrics: string; audio_url: string | null; video_url: string | null; level: string; plan_required: string; status: string; order_index: number }
type FormData = Omit<Song, 'id'> & { id?: string }

const empty = (): FormData => ({ slug: '', title: '', artist: '', lyrics: '', audio_url: '', video_url: '', level: 'A1', plan_required: 'free', status: 'draft', order_index: 0 })

export function SongsManager() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormData | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoDragOver, setVideoDragOver] = useState(false)
  const audioRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/songs')
    const { data } = await res.json()
    setSongs(data ?? [])
    setLoading(false)
  }

  async function save() {
    if (!form || !form.title.trim()) { toast.error('El título es obligatorio'); return }
    setSaving(true)
    const payload = { ...form, slug: form.slug || slugify(form.title), audio_url: form.audio_url || null, video_url: form.video_url || null }
    const res = form.id
      ? await fetch(`/api/admin/songs/${form.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/admin/songs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) { toast.success(form.id ? 'Canzone aggiornata' : 'Canzone creata'); setForm(null); load() }
    else { const e = await res.json(); toast.error(e.error ?? 'Error') }
    setSaving(false)
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar esta canción?')) return
    const res = await fetch(`/api/admin/songs/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Eliminada'); load() }
  }

  async function toggleStatus(song: Song) {
    const newStatus = song.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/admin/songs/${song.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    setSongs(prev => prev.map(s => s.id === song.id ? { ...s, status: newStatus } : s))
  }

  async function handleAudioFile(file: File) {
    const maxMB = 50
    if (file.size > maxMB * 1024 * 1024) { toast.error(`El audio no puede superar ${maxMB}MB`); return }
    setUploadingAudio(true)
    try {
      const url = await uploadToStorage(file, 'songs/audio')
      setForm(f => f ? { ...f, audio_url: url } : f)
      toast.success('Audio subido correctamente')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al subir audio')
    } finally {
      setUploadingAudio(false)
      if (audioRef.current) audioRef.current.value = ''
    }
  }

  async function handleVideoFile(file: File) {
    const maxMB = 500
    if (file.size > maxMB * 1024 * 1024) { toast.error(`El video no puede superar ${maxMB}MB`); return }
    setUploadingVideo(true)
    setVideoProgress(0)
    try {
      const url = await uploadToStorage(file, 'songs/video', (pct) => setVideoProgress(pct))
      setForm(f => f ? { ...f, video_url: url } : f)
      toast.success('Video subido correctamente')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al subir video')
    } finally {
      setUploadingVideo(false)
      setVideoProgress(0)
      if (videoRef.current) videoRef.current.value = ''
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music size={22} className="text-pink-400" />
          <h1 className="text-2xl font-extrabold text-verde-50">Canzoni</h1>
          <span className="text-xs text-verde-600 bg-verde-950/40 border border-verde-900/30 px-2 py-1 rounded-lg">{songs.length} canzoni</span>
        </div>
        <button onClick={() => setForm(empty())} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-verde-700 hover:bg-verde-600 text-white text-sm font-semibold transition-colors">
          <Plus size={16} /> Nueva canción
        </button>
      </div>

      {/* Form Modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-bg-dark border border-verde-800/40 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-verde-900/30">
              <h2 className="text-lg font-bold text-verde-100">{form.id ? 'Editar' : 'Nueva'} canción</h2>
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
                  <label className="block text-xs text-verde-500 mb-1">Artista</label>
                  <input value={form.artist} onChange={e => setForm(f => f ? { ...f, artist: e.target.value } : f)}
                    className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none focus:border-verde-600" />
                </div>
                <div>
                  <label className="block text-xs text-verde-500 mb-1">Slug</label>
                  <input value={form.slug} onChange={e => setForm(f => f ? { ...f, slug: e.target.value } : f)}
                    className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-400 text-sm focus:outline-none focus:border-verde-600" />
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
              </div>

              {/* Audio Upload */}
              <div>
                <label className="block text-xs text-verde-500 mb-2">Audio (MP3/OGG/WAV/AAC — max 50MB)</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={audioRef}
                    type="file"
                    accept=".mp3,.ogg,.wav,.aac,.m4a,.flac,audio/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleAudioFile(f) }}
                  />
                  <button
                    type="button"
                    onClick={() => audioRef.current?.click()}
                    disabled={uploadingAudio}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-300 text-xs hover:border-verde-600 hover:text-verde-200 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {uploadingAudio
                      ? <Loader2 size={13} className="animate-spin" />
                      : form.audio_url
                        ? <CheckCircle2 size={13} className="text-verde-400" />
                        : <Paperclip size={13} />}
                    {uploadingAudio ? 'Subiendo...' : 'Subir audio'}
                  </button>
                  <input
                    value={form.audio_url ?? ''}
                    onChange={e => setForm(f => f ? { ...f, audio_url: e.target.value } : f)}
                    placeholder="o pega URL del audio..."
                    className="flex-1 px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none focus:border-verde-600"
                  />
                </div>
                {form.audio_url && !uploadingAudio && (
                  <p className="mt-1 text-xs text-verde-600 truncate">{form.audio_url}</p>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-xs text-verde-500 mb-2">Video (MP4/WebM/MOV — max 500MB)</label>
                <input
                  ref={videoRef}
                  type="file"
                  accept=".mp4,.webm,.mov,.avi,.mkv,video/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoFile(f) }}
                />
                <div
                  onDragOver={e => { e.preventDefault(); setVideoDragOver(true) }}
                  onDragLeave={() => setVideoDragOver(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setVideoDragOver(false)
                    const f = e.dataTransfer.files[0]
                    if (f) handleVideoFile(f)
                  }}
                  onClick={() => !uploadingVideo && videoRef.current?.click()}
                  className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                    videoDragOver
                      ? 'border-verde-500 bg-verde-950/40'
                      : 'border-verde-800/40 bg-verde-950/20 hover:border-verde-700/60 hover:bg-verde-950/30'
                  } ${uploadingVideo ? 'pointer-events-none' : ''}`}
                >
                  <div className="flex flex-col items-center justify-center py-4 px-3 gap-1">
                    {uploadingVideo ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-verde-500" />
                        <span className="text-xs text-verde-400">Subiendo video... {videoProgress}%</span>
                        <div className="w-full mt-1 h-1.5 rounded-full bg-verde-900/60 overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all duration-200" style={{ width: `${videoProgress}%` }} />
                        </div>
                      </>
                    ) : form.video_url && form.video_url.startsWith('http') ? (
                      <>
                        <CheckCircle2 size={18} className="text-verde-400" />
                        <span className="text-xs text-verde-400">Video subido</span>
                        <span className="text-xs text-verde-600 truncate max-w-full px-2">{form.video_url}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={18} className="text-verde-700" />
                        <span className="text-xs text-verde-500">Arrastra un video o haz clic para seleccionar</span>
                      </>
                    )}
                  </div>
                </div>
                <input
                  value={form.video_url ?? ''}
                  onChange={e => setForm(f => f ? { ...f, video_url: e.target.value } : f)}
                  placeholder="o pega URL del video (YouTube, etc.)..."
                  className="mt-2 w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none focus:border-verde-600"
                />
              </div>

              <div>
                <label className="block text-xs text-verde-500 mb-1">Letra</label>
                <textarea value={form.lyrics} onChange={e => setForm(f => f ? { ...f, lyrics: e.target.value } : f)} rows={6}
                  className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none focus:border-verde-600 resize-none" />
              </div>
              <div>
                <label className="block text-xs text-verde-500 mb-1">Orden</label>
                <input type="number" value={form.order_index} onChange={e => setForm(f => f ? { ...f, order_index: parseInt(e.target.value) || 0 } : f)}
                  className="w-28 px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-verde-900/30">
              <button onClick={save} disabled={saving || uploadingAudio || uploadingVideo} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white font-semibold text-sm disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null} {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setForm(null)} className="px-5 py-2.5 rounded-xl border border-verde-800/40 text-verde-400 hover:text-verde-200 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-verde-600" /></div>
      ) : songs.length === 0 ? (
        <div className="text-center py-20 text-verde-600"><Music size={36} className="mx-auto mb-3 text-verde-800" /><p>No hay canzoni todavía</p></div>
      ) : (
        <div className="rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-verde-900/30">
              {['#', 'Título / Artista', 'Nivel', 'Plan', 'Estado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-verde-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-verde-900/10">
              {songs.map(song => (
                <tr key={song.id} className="hover:bg-verde-950/20 transition-colors">
                  <td className="px-4 py-3 text-verde-600 text-xs">{song.order_index}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-verde-200">{song.title}</div>
                    <div className="text-xs text-verde-500">{song.artist}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${LEVEL_COLORS[song.level]}`}>{song.level}</span></td>
                  <td className="px-4 py-3 text-xs text-verde-400 capitalize">{song.plan_required}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(song)} className="flex items-center gap-1.5 text-xs transition-colors">
                      {song.status === 'published'
                        ? <><ToggleRight size={16} className="text-verde-400" /><span className="text-verde-400">Publicada</span></>
                        : <><ToggleLeft size={16} className="text-verde-700" /><span className="text-verde-600">Borrador</span></>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setForm({ ...song })} className="p-1.5 text-verde-600 hover:text-verde-300 transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => del(song.id)} className="p-1.5 text-red-700 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
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
