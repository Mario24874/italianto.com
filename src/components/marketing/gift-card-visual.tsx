'use client'

/**
 * La gift card dibujada en CSS: tricolor italiano, brillo animado y tilt 3D.
 * Se usa en /regalo (hero interactivo) y en la promo de home/lancio.
 */
export function GiftCardVisual({
  planLabel,
  monthsLabel,
  code = 'ITAL-••••-••••-••••',
  compact = false,
}: {
  planLabel: string
  monthsLabel: string
  code?: string
  compact?: boolean
}) {
  return (
    <div className="gift-card-tilt" style={{ perspective: '1000px' }}>
      <style>{`
        .gift-card-tilt > div { transition: transform 0.5s ease; transform: rotateY(-6deg) rotateX(3deg); }
        .gift-card-tilt:hover > div { transform: rotateY(0deg) rotateX(0deg) scale(1.02); }
        @keyframes gift-shine {
          0%, 60% { transform: translateX(-130%) skewX(-18deg); }
          100% { transform: translateX(230%) skewX(-18deg); }
        }
        .gift-shine { animation: gift-shine 4.5s ease-in-out infinite; }
      `}</style>
      <div
        className={`relative overflow-hidden rounded-3xl border border-verde-700/60 shadow-2xl ${
          compact ? 'w-full max-w-xs' : 'w-full max-w-sm'
        }`}
        style={{
          background: 'linear-gradient(135deg, #0d1f0e 0%, #16331a 45%, #0a1a0b 100%)',
          boxShadow: '0 24px 60px -16px rgba(0, 146, 70, 0.45)',
        }}
      >
        {/* brillo que recorre la tarjeta */}
        <div className="pointer-events-none absolute inset-y-0 w-1/3 gift-shine bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* tricolor superior */}
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#009246]" />
          <div className="flex-1 bg-[#f8fdf8]" />
          <div className="flex-1 bg-[#ce2b37]" />
        </div>

        <div className={compact ? 'p-5' : 'p-7'}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-[0.2em] text-verde-300">
              ITALIANTO
            </span>
            <span className="text-[10px] font-semibold tracking-[0.18em] text-verde-500">
              GIFT CARD
            </span>
          </div>

          <div className={compact ? 'mt-5' : 'mt-8'}>
            <div className={`font-extrabold text-verde-50 ${compact ? 'text-xl' : 'text-2xl'}`}>
              {planLabel}
            </div>
            <div className="text-sm text-verde-400 mt-0.5">{monthsLabel}</div>
          </div>

          <div className={`inline-block rounded-xl border border-dashed border-verde-500/70 bg-bg-dark/80 px-4 py-2.5 ${compact ? 'mt-4' : 'mt-6'}`}>
            <span className={`font-mono font-bold tracking-[0.14em] text-verde-300 ${compact ? 'text-xs' : 'text-sm'}`}>
              {code}
            </span>
          </div>
        </div>

        {/* tricolor inferior */}
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#009246]" />
          <div className="flex-1 bg-[#f8fdf8]" />
          <div className="flex-1 bg-[#ce2b37]" />
        </div>
      </div>
    </div>
  )
}
