'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

export function ReviewButtons({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function review(action: 'approve' | 'reject') {
    let adminNote: string | undefined
    if (action === 'reject') {
      const input = window.prompt('Motivo del rechazo (se envía al usuario):')
      if (input === null) return
      adminNote = input.trim() || undefined
    } else if (!window.confirm('¿Aprobar este pago y activar el plan?')) {
      return
    }

    setBusy(true)
    try {
      const res = await fetch(`/api/admin/manual-payments/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Error: ${data.error}`)
        return
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => review('approve')}
        disabled={busy}
        title="Aprobar y activar plan"
        className="inline-flex items-center gap-1 rounded-lg bg-verde-800/60 hover:bg-verde-700/70 text-verde-100 text-xs font-semibold px-2.5 py-1.5 transition-colors disabled:opacity-50"
      >
        <Check size={13} /> Aprobar
      </button>
      <button
        onClick={() => review('reject')}
        disabled={busy}
        title="Rechazar"
        className="inline-flex items-center gap-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-semibold px-2.5 py-1.5 transition-colors disabled:opacity-50"
      >
        <X size={13} /> Rechazar
      </button>
    </div>
  )
}
