'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 text-sm font-semibold text-verde-300 bg-verde-950/60 border border-verde-700/50 rounded-xl px-4 py-2 hover:bg-verde-900/60 transition-colors print:hidden"
    >
      <Printer size={15} />
      Imprimir / Guardar PDF
    </button>
  )
}
