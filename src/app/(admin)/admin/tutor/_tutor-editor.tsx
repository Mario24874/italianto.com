'use client'

import { useState, useEffect } from 'react'
import {
  BrainCircuit, Save, Loader2, CheckCircle2, AlertTriangle,
  User, Bot, Plus, Trash2, Pencil, X, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Gemini Live voices ────────────────────────────────────────────────────────
const GEMINI_VOICES = [
  { id: 'Puck',    label: 'Puck',     desc: 'Male · warm, upbeat'      },
  { id: 'Charon',  label: 'Charon',   desc: 'Male · clear, informative' },
  { id: 'Fenrir',  label: 'Fenrir',   desc: 'Male · strong, expressive' },
  { id: 'Aoede',   label: 'Aoede',    desc: 'Female · warm, breezy'    },
  { id: 'Kore',    label: 'Kore',     desc: 'Female · firm, professional'},
  { id: 'Leda',    label: 'Leda',     desc: 'Female · soft, gentle'    },
]

// Default recommended avatar → voice mapping (shown in UI)
const DEFAULT_VOICE_MAP: Record<string, string> = {
  marco:     'Puck',
  giovanni:  'Charon',
  giulia:    'Aoede',
  francesca: 'Kore',
}

const TEMPLATE_VARS = [
  { var: '{{tutor_name}}',   desc: 'Nombre del tutor activo' },
  { var: '{{nivel}}',        desc: 'Nivel declarado por el alumno (A1-B2)' },
  { var: '{{registro}}',     desc: 'Registro elegido (informale/formale)' },
  { var: '{{tono}}',         desc: 'Tono elegido (amichevole/professionale/incoraggiante)' },
  { var: '{{focus}}',        desc: 'Foco de sesión (conversazione/grammatica/vocabolario/pronuncia)' },
  { var: '{{modismi}}',      desc: 'Modismos regionales (neutro/roma/milano/napoli)' },
  { var: '{{knowledge_base}}', desc: 'Base de conocimiento del portal (se inyecta automáticamente)' },
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface TutorConfigData {
  knowledge_base: string
  system_prompt_template: string
  tutor_name: string
  avatar_url: string
}

interface TutorRow {
  id: string
  slug: string
  name: string
  description: string
  avatar_url: string | null
  elevenlabs_voice_id: string | null  // stores Gemini voice name since migration to Gemini Live
  is_active: boolean
  sort_order: number
}

const EMPTY_TUTOR: Omit<TutorRow, 'id' | 'sort_order'> = {
  slug: '', name: '', description: '', avatar_url: null, elevenlabs_voice_id: null, is_active: true,
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TutorEditor() {
  const [config, setConfig] = useState<TutorConfigData>({
    knowledge_base: '',
    system_prompt_template: '',
    tutor_name: 'Marco',
    avatar_url: '',
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [showVars, setShowVars] = useState(false)

  const [tutors, setTutors]               = useState<TutorRow[]>([])
  const [tutorsLoading, setTutorsLoading] = useState(true)
  const [editingTutor, setEditingTutor]   = useState<(Omit<TutorRow, 'id' | 'sort_order'> & { id?: string }) | null>(null)
  const [tutorSaving, setTutorSaving]     = useState(false)
  const [tutorError, setTutorError]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/tutor')
      .then(r => r.json())
      .then(d => {
        if (d.config) {
          const cfg = d.config
          setConfig({
            knowledge_base:          cfg.knowledge_base ?? '',
            system_prompt_template:  cfg.system_prompt_template ?? '',
            tutor_name:              cfg.tutor_name ?? 'Marco',
            avatar_url:              cfg.avatar_url ?? '',
          })
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const loadTutors = () => {
    setTutorsLoading(true)
    fetch('/api/admin/tutors')
      .then(r => r.json())
      .then(d => setTutors(d.tutors ?? []))
      .catch(() => {})
      .finally(() => setTutorsLoading(false))
  }
  useEffect(() => { loadTutors() }, [])

  const saveTutor = async () => {
    if (!editingTutor) return
    setTutorSaving(true); setTutorError(null)
    try {
      const isNew = !editingTutor.id
      const url = isNew ? '/api/admin/tutors' : `/api/admin/tutors/${editingTutor.id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTutor),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Error al guardar')
      setEditingTutor(null); loadTutors()
    } catch (e) {
      setTutorError(e instanceof Error ? e.message : 'Error desconocido')
    } finally { setTutorSaving(false) }
  }

  const deleteTutor = async (id: string) => {
    if (!confirm('¿Eliminar este tutor?')) return
    await fetch(`/api/admin/tutors/${id}`, { method: 'DELETE' })
    loadTutors()
  }

  const save = async () => {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch('/api/admin/tutor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Error al guardar')
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-verde-500" />
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-verde-50 flex items-center gap-2">
            <BrainCircuit size={22} className="text-verde-400" />
            Tutor AI — Configurazione
          </h1>
          <p className="text-verde-500 text-sm mt-1">
            Gemini Live · Voce in tempo reale · Bassa latenza
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving  ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
          : saved  ? <><CheckCircle2 size={14} className="text-emerald-300" /> Salvato</>
          :          <><Save size={14} /> Salva</>}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* ── Identità globale ── */}
      <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6 space-y-4">
        <h2 className="font-semibold text-verde-200 text-sm uppercase tracking-wide flex items-center gap-2">
          <User size={15} className="text-verde-400" /> Identità globale del tutor
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-verde-400 text-xs font-medium">Nome default</label>
            <input type="text" value={config.tutor_name}
              onChange={e => setConfig(c => ({ ...c, tutor_name: e.target.value }))}
              placeholder="Marco"
              className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-2.5 text-sm text-verde-200 placeholder:text-verde-700 focus:outline-none focus:ring-1 focus:ring-verde-700" />
            <p className="text-verde-700 text-xs">Nombre del tutor cuando no se selecciona uno específico.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-verde-400 text-xs font-medium">URL Avatar (optional)</label>
            <input type="url" value={config.avatar_url}
              onChange={e => setConfig(c => ({ ...c, avatar_url: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-2.5 text-sm text-verde-200 placeholder:text-verde-700 focus:outline-none focus:ring-1 focus:ring-verde-700 font-mono" />
          </div>
        </div>
      </div>

      {/* ── Tutors list ── */}
      <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-verde-200 text-sm uppercase tracking-wide flex items-center gap-2">
              <Bot size={15} className="text-verde-400" /> Tutors Disponibili
            </h2>
            <p className="text-verde-600 text-xs mt-1">Visibles por los alumnos en /tutor. La voz determina la voz Gemini Live.</p>
          </div>
          <button onClick={() => setEditingTutor({ ...EMPTY_TUTOR })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-verde-800/50 text-verde-200 hover:bg-verde-700/60 border border-verde-700/40 transition-colors">
            <Plus size={13} /> Nuevo tutor
          </button>
        </div>

        {tutorError && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">
            <AlertTriangle size={15} /> {tutorError}
          </div>
        )}

        {tutorsLoading ? (
          <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-verde-500" /></div>
        ) : (
          <div className="space-y-2">
            {tutors.map(t => {
              const voiceLabel = GEMINI_VOICES.find(v => v.id === t.elevenlabs_voice_id)?.label ?? t.elevenlabs_voice_id ?? 'Default'
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-verde-900/30 bg-verde-950/20">
                  <div className="size-10 rounded-full overflow-hidden ring-1 ring-verde-800 shrink-0">
                    {t.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={t.avatar_url} alt={t.name} className="size-full object-cover" />
                      : <div className="size-full bg-verde-900/60 flex items-center justify-center"><Bot size={16} className="text-verde-400" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-verde-100 text-sm font-medium">{t.name} <span className="text-verde-600 font-normal">/{t.slug}</span></p>
                    <p className="text-verde-600 text-xs">Voz: {voiceLabel} · {t.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${t.is_active ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/30' : 'text-red-400 bg-red-950/30 border-red-800/30'}`}>
                    {t.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <button onClick={() => setEditingTutor({ ...t })} className="p-1.5 text-verde-600 hover:text-verde-300"><Pencil size={14} /></button>
                  <button onClick={() => deleteTutor(t.id)} className="p-1.5 text-red-700 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              )
            })}
            {tutors.length === 0 && <p className="text-verde-700 text-sm text-center py-4">No hay tutors. Crea el primero.</p>}
          </div>
        )}
      </div>

      {/* ── Edit/Create tutor modal ── */}
      {editingTutor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-dark border border-verde-900/50 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-verde-100 font-bold">{editingTutor.id ? 'Editar Tutor' : 'Nuevo Tutor'}</h3>
              <button onClick={() => setEditingTutor(null)} className="text-verde-600 hover:text-verde-300"><X size={18} /></button>
            </div>
            {tutorError && <div className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">{tutorError}</div>}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-verde-500 text-xs">Nombre</label>
                  <input type="text" value={editingTutor.name}
                    onChange={e => setEditingTutor(t => t ? { ...t, name: e.target.value } : t)}
                    className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-3 py-2 text-sm text-verde-200 focus:outline-none focus:ring-1 focus:ring-verde-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-verde-500 text-xs">Slug (URL)</label>
                  <input type="text" value={editingTutor.slug}
                    onChange={e => setEditingTutor(t => t ? { ...t, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') } : t)}
                    className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-3 py-2 text-sm text-verde-200 font-mono focus:outline-none focus:ring-1 focus:ring-verde-700" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-verde-500 text-xs">Descripción</label>
                <input type="text" value={editingTutor.description}
                  onChange={e => setEditingTutor(t => t ? { ...t, description: e.target.value } : t)}
                  placeholder="Ej: Especialista en conversación A1-B1"
                  className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-3 py-2 text-sm text-verde-200 focus:outline-none focus:ring-1 focus:ring-verde-700" />
              </div>

              <div className="space-y-1">
                <label className="text-verde-500 text-xs">URL Avatar</label>
                <input type="url" value={editingTutor.avatar_url ?? ''}
                  onChange={e => setEditingTutor(t => t ? { ...t, avatar_url: e.target.value || null } : t)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-3 py-2 text-sm text-verde-200 font-mono focus:outline-none focus:ring-1 focus:ring-verde-700" />
              </div>

              {/* Gemini Live voice selector */}
              <div className="space-y-1">
                <label className="text-verde-500 text-xs">Voz Gemini Live</label>
                <select
                  value={editingTutor.elevenlabs_voice_id ?? DEFAULT_VOICE_MAP[editingTutor.slug] ?? 'Puck'}
                  onChange={e => setEditingTutor(t => t ? { ...t, elevenlabs_voice_id: e.target.value || null } : t)}
                  className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-3 py-2 text-sm text-verde-200 focus:outline-none focus:ring-1 focus:ring-verde-700">
                  <option value="">— Default automático —</option>
                  {GEMINI_VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.label} — {v.desc}</option>
                  ))}
                </select>
                <p className="text-verde-700 text-xs">
                  Recomendado: Marco→Puck, Giovanni→Charon, Giulia→Aoede, Francesca→Kore
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="tutor-active" checked={editingTutor.is_active}
                  onChange={e => setEditingTutor(t => t ? { ...t, is_active: e.target.checked } : t)}
                  className="rounded" />
                <label htmlFor="tutor-active" className="text-verde-400 text-sm">Activo (visible para alumnos)</label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={saveTutor} disabled={tutorSaving} className="flex-1">
                {tutorSaving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Save size={14} /> Guardar</>}
              </Button>
              <button onClick={() => setEditingTutor(null)} className="px-4 py-2 text-sm text-verde-500 hover:text-verde-300 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Knowledge Base ── */}
      <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6 space-y-3">
        <div>
          <h2 className="font-semibold text-verde-200 text-sm uppercase tracking-wide">Base di Conoscenza</h2>
          <p className="text-verde-600 text-xs mt-1">
            Contexto de la plataforma. Se inyecta via <code className="text-verde-400">{'{{knowledge_base}}'}</code>.
            Incluye: metodología del curso, niveles que ofreces, objetivos del alumno típico.
          </p>
        </div>
        <textarea value={config.knowledge_base}
          onChange={e => setConfig(c => ({ ...c, knowledge_base: e.target.value }))}
          rows={6}
          className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-3 text-sm text-verde-200 placeholder:text-verde-700 resize-y focus:outline-none focus:ring-1 focus:ring-verde-700 font-mono"
          placeholder={`Italianto es una plataforma de italiano para hispanohablantes.\nNiveles: A1 a B2. Método comunicativo directo.\nLos alumnos quieren fluidez conversacional.`} />
        <p className="text-verde-700 text-xs text-right">{config.knowledge_base.length} chars</p>
      </div>

      {/* ── System Prompt ── */}
      <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6 space-y-3">
        <div>
          <h2 className="font-semibold text-verde-200 text-sm uppercase tracking-wide">Prompt di Sistema</h2>
          <p className="text-verde-600 text-xs mt-1">
            Si está vacío, se usa el prompt pedagógico predeterminado (recomendado).
            Si lo rellenas, reemplaza completamente el prompt base — asegúrate de incluir las reglas de voz.
          </p>
        </div>

        {/* Template variables reference */}
        <button onClick={() => setShowVars(v => !v)}
          className="flex items-center gap-1.5 text-xs text-verde-500 hover:text-verde-300 transition-colors">
          <Info size={12} /> {showVars ? 'Ocultar variables disponibles' : 'Ver variables disponibles'}
        </button>
        {showVars && (
          <div className="rounded-xl border border-verde-900/20 bg-verde-950/30 p-3 space-y-1.5">
            {TEMPLATE_VARS.map(v => (
              <div key={v.var} className="flex items-start gap-3">
                <code className="text-verde-400 text-xs font-mono shrink-0">{v.var}</code>
                <span className="text-verde-600 text-xs">{v.desc}</span>
              </div>
            ))}
          </div>
        )}

        <textarea value={config.system_prompt_template}
          onChange={e => setConfig(c => ({ ...c, system_prompt_template: e.target.value }))}
          rows={14}
          className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-3 text-sm text-verde-200 placeholder:text-verde-700 resize-y focus:outline-none focus:ring-1 focus:ring-verde-700 font-mono"
          placeholder="Dejar vacío para usar el prompt pedagógico predeterminado..." />
        <p className="text-verde-700 text-xs text-right">{config.system_prompt_template.length} chars</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><Save size={14} /> Salva configurazione</>}
        </Button>
      </div>
    </div>
  )
}
