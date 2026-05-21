'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X, Check, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  currentName: string | null
}

export function EditUserDialog({ userId, currentName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setOpen(false)
      router.refresh()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Editar nombre"
        className="inline-flex items-center justify-center size-7 rounded-lg text-verde-500 hover:text-verde-300 hover:bg-verde-950/50 transition-colors cursor-pointer"
      >
        <Pencil size={13} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-bg-dark border border-verde-900/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-verde-200">Editar nombre del usuario</h3>
              <button onClick={() => setOpen(false)} className="text-verde-600 hover:text-verde-400 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              className="w-full px-3 py-2.5 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
            />

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-verde-500 hover:text-verde-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={loading || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-verde-700 hover:bg-verde-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
