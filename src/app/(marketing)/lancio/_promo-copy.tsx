'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function PromoCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: ignore
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 font-mono font-bold tracking-widest text-verde-200 bg-verde-800/60 border border-verde-600/50 rounded-lg px-3 py-1 hover:bg-verde-700/60 transition-colors text-sm"
      title="Copiar código"
    >
      {code}
      {copied ? (
        <Check size={13} className="text-green-400" />
      ) : (
        <Copy size={13} className="text-verde-500" />
      )}
    </button>
  )
}
