'use client'

import { useState, useEffect } from 'react'
import { BrainCircuit, Save, Loader2, CheckCircle2, AlertTriangle, User, Mic, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TutorConfigData {
  knowledge_base: string
  system_prompt_template: string
  tutor_name: string
  avatar_url: string
  elevenlabs_voice_id: string
}

const KNOWN_VOICES = [
  { id: 'b8jhBTcGAq4kQGWmKprT', label: 'Marco (default)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella' },
  { id: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel' },
  { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', label: 'Sam' },
]

export function TutorEditor() {
  const [config, setConfig] = useState<TutorConfigData>({
    knowledge_base: '',
    system_prompt_template: '',
    tutor_name: 'Marco',
    avatar_url: '',
    elevenlabs_voice_id: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voiceMode, setVoiceMode] = useState<'preset' | 'custom'>('preset')

  useEffect(() => {
    fetch('/api/admin/tutor')
      .then(r => r.json())
      .then(d => {
        if (d.config) {
          const cfg = d.config
          setConfig({
            knowledge_base: cfg.knowledge_base ?? '',
            system_prompt_template: cfg.system_prompt_template ?? '',
            tutor_name: cfg.tutor_name ?? 'Marco',
            avatar_url: cfg.avatar_url ?? '',
            elevenlabs_voice_id: cfg.elevenlabs_voice_id ?? '',
          })
          const isPreset = KNOWN_VOICES.some(v => v.id === cfg.elevenlabs_voice_id)
          setVoiceMode(isPreset || !cfg.elevenlabs_voice_id ? 'preset' : 'custom')
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/tutor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Error al guardar')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-verde-500" />
      </div>
    )
  }

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
            Identità, voce e base di conoscenza del tutor.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Salvando...</>
          ) : saved ? (
            <><CheckCircle2 size={14} className="text-emerald-300" /> Salvato</>
          ) : (
            <><Save size={14} /> Salva</>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {/* ── Identità del Tutor ── */}
      <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6 space-y-5">
        <h2 className="font-semibold text-verde-200 text-sm uppercase tracking-wide flex items-center gap-2">
          <User size={15} className="text-verde-400" />
          Identità del Tutor
        </h2>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-verde-400 text-xs font-medium">Nome del tutor</label>
          <input
            type="text"
            value={config.tutor_name}
            onChange={e => setConfig(c => ({ ...c, tutor_name: e.target.value }))}
            placeholder="Marco"
            className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-2.5 text-sm text-verde-200
              placeholder:text-verde-700 focus:outline-none focus:ring-1 focus:ring-verde-700"
          />
          <p className="text-verde-700 text-xs">
            Aparece en el avatar, el saludo inicial y el prompt de sistema.
          </p>
        </div>

        {/* Avatar */}
        <div className="space-y-1.5">
          <label className="text-verde-400 text-xs font-medium flex items-center gap-1.5">
            <ImageIcon size={12} />
            URL Avatar / Foto
          </label>
          <input
            type="url"
            value={config.avatar_url}
            onChange={e => setConfig(c => ({ ...c, avatar_url: e.target.value }))}
            placeholder="https://example.com/marco.jpg"
            className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-2.5 text-sm text-verde-200
              placeholder:text-verde-700 focus:outline-none focus:ring-1 focus:ring-verde-700 font-mono"
          />
          {config.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.avatar_url}
              alt="Preview avatar"
              className="size-16 rounded-full object-cover ring-2 ring-verde-700 mt-2"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <p className="text-verde-700 text-xs">
            URL pública. Sube la foto a Supabase Storage u otro CDN y pega la URL aquí.
          </p>
        </div>

        {/* Voice */}
        <div className="space-y-1.5">
          <label className="text-verde-400 text-xs font-medium flex items-center gap-1.5">
            <Mic size={12} />
            Voce ElevenLabs
          </label>
          <div className="flex gap-2 mb-2">
            {(['preset', 'custom'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setVoiceMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  voiceMode === mode
                    ? 'bg-verde-800/60 text-verde-200 border border-verde-700/50'
                    : 'text-verde-600 hover:text-verde-400 border border-transparent'
                }`}
              >
                {mode === 'preset' ? 'Preset' : 'ID personalizzato'}
              </button>
            ))}
          </div>

          {voiceMode === 'preset' ? (
            <select
              value={config.elevenlabs_voice_id}
              onChange={e => setConfig(c => ({ ...c, elevenlabs_voice_id: e.target.value }))}
              className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-2.5 text-sm text-verde-200
                focus:outline-none focus:ring-1 focus:ring-verde-700"
            >
              <option value="">— Seleziona voce —</option>
              {KNOWN_VOICES.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={config.elevenlabs_voice_id}
              onChange={e => setConfig(c => ({ ...c, elevenlabs_voice_id: e.target.value }))}
              placeholder="Voice ID ElevenLabs (ej. b8jhBTcGAq4kQGWmKprT)"
              className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-2.5 text-sm text-verde-200
                placeholder:text-verde-700 focus:outline-none focus:ring-1 focus:ring-verde-700 font-mono"
            />
          )}
          <p className="text-verde-700 text-xs">
            Encuentra los Voice ID en <span className="text-verde-500">ElevenLabs → Voices</span>.
            Si vacío, usa la voz por defecto de la app nativa.
          </p>
        </div>
      </div>

      {/* ── Knowledge Base ── */}
      <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6 space-y-3">
        <div>
          <h2 className="font-semibold text-verde-200 text-sm uppercase tracking-wide">
            Base di Conoscenza
          </h2>
          <p className="text-verde-600 text-xs mt-1">
            Siempre incluida en el prompt AI de cada sesión.
          </p>
        </div>
        <textarea
          value={config.knowledge_base}
          onChange={e => setConfig(c => ({ ...c, knowledge_base: e.target.value }))}
          rows={12}
          className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-3 text-sm text-verde-200
            placeholder:text-verde-700 resize-y focus:outline-none focus:ring-1 focus:ring-verde-700 font-mono"
          placeholder={`Esempio:\n- Metodo basato sulla comunicazione diretta\n- Utenti ispanofoni, livelli A1-B2\n- Enfatizzare pronuncia e conversazione quotidiana`}
        />
        <p className="text-verde-700 text-xs text-right">{config.knowledge_base.length} caratteri</p>
      </div>

      {/* ── System Prompt ── */}
      <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6 space-y-3">
        <div>
          <h2 className="font-semibold text-verde-200 text-sm uppercase tracking-wide">
            Prompt di Sistema Personalizzato
          </h2>
          <p className="text-verde-600 text-xs mt-1">
            Opzionale. Se compilato sostituisce completamente il prompt predefinito.
            Usa <code className="text-verde-400">{'${tutorName}'}</code> para el nombre del tutor.
          </p>
        </div>
        <textarea
          value={config.system_prompt_template}
          onChange={e => setConfig(c => ({ ...c, system_prompt_template: e.target.value }))}
          rows={10}
          className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-3 text-sm text-verde-200
            placeholder:text-verde-700 resize-y focus:outline-none focus:ring-1 focus:ring-verde-700 font-mono"
          placeholder="Lascia vuoto per usare il prompt predefinito..."
        />
        <p className="text-verde-700 text-xs text-right">{config.system_prompt_template.length} caratteri</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving
            ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
            : <><Save size={14} /> Salva configurazione</>
          }
        </Button>
      </div>
    </div>
  )
}
