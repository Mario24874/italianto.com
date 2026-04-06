'use client'

import { useState, useEffect } from 'react'
import { BrainCircuit, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TutorConfigData {
  knowledge_base: string
  system_prompt_template: string
}

export function TutorEditor() {
  const [config, setConfig] = useState<TutorConfigData>({
    knowledge_base: '',
    system_prompt_template: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/tutor')
      .then(r => r.json())
      .then(d => {
        if (d.config) {
          setConfig({
            knowledge_base: d.config.knowledge_base ?? '',
            system_prompt_template: d.config.system_prompt_template ?? '',
          })
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
            La base di conoscenza è inclusa nel prompt di sistema di ogni sessione tutor.
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

      {/* Knowledge Base */}
      <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6 space-y-3">
        <div>
          <h2 className="font-semibold text-verde-200 text-sm uppercase tracking-wide">
            Base di Conoscenza
          </h2>
          <p className="text-verde-600 text-xs mt-1">
            Informazioni sul metodo di insegnamento, argomenti da enfatizzare, comportamento del tutor, ecc.
            Sempre inclusa nel prompt AI durante le sessioni.
          </p>
        </div>
        <textarea
          value={config.knowledge_base}
          onChange={e => setConfig(c => ({ ...c, knowledge_base: e.target.value }))}
          rows={14}
          className="w-full rounded-xl border border-verde-900/30 bg-verde-950/20 px-4 py-3 text-sm text-verde-200
            placeholder:text-verde-700 resize-y focus:outline-none focus:ring-1 focus:ring-verde-700 font-mono"
          placeholder={`Esempio:
- Il metodo di insegnamento si basa sulla comunicazione diretta
- Enfatizzare la pronuncia corretta delle vocali italiane
- Gli utenti sono prevalentemente ispanofoni
- Livelli coperti: A1-B2
- Concentrarsi su: saluti, ordinazioni al ristorante, viaggi, conversazione quotidiana
- Correggere con gentilezza senza interrompere il flusso
- Usare esempi pratici e situazioni reali`}
        />
        <p className="text-verde-700 text-xs text-right">
          {config.knowledge_base.length} caratteri
        </p>
      </div>

      {/* Custom System Prompt */}
      <div className="rounded-2xl border border-verde-900/30 bg-verde-950/10 p-6 space-y-3">
        <div>
          <h2 className="font-semibold text-verde-200 text-sm uppercase tracking-wide">
            Prompt di Sistema Personalizzato
          </h2>
          <p className="text-verde-600 text-xs mt-1">
            Opzionale. Se compilato, sostituisce completamente il prompt di sistema predefinito.
            Usa <code className="text-verde-400">{'${tutorName}'}</code> per inserire il nome del tutor scelto dall&apos;utente.
            Se vuoto, viene usato il prompt predefinito (con la base di conoscenza aggiunta in fondo).
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
        <p className="text-verde-700 text-xs text-right">
          {config.system_prompt_template.length} caratteri
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><Save size={14} /> Salva configurazione</>}
        </Button>
      </div>
    </div>
  )
}
