/**
 * Certificado de nivel dibujado en CSS — misma familia visual que GiftCardVisual
 * (tricolore italiano, brillo animado, tilt 3D). Uso informativo en home/lancio.
 */
export function CertificateVisual({
  levelLabel = 'B1',
  compact = false,
}: {
  levelLabel?: string
  compact?: boolean
}) {
  return (
    <div className="cert-tilt" style={{ perspective: '1000px' }}>
      <style>{`
        .cert-tilt > div { transition: transform 0.5s ease; transform: rotateY(6deg) rotateX(3deg); }
        .cert-tilt:hover > div { transform: rotateY(0deg) rotateX(0deg) scale(1.02); }
        @keyframes cert-shine {
          0%, 60% { transform: translateX(-130%) skewX(-18deg); }
          100% { transform: translateX(230%) skewX(-18deg); }
        }
        @keyframes cert-seal {
          0%, 100% { transform: rotate(-4deg) scale(1); }
          50% { transform: rotate(-4deg) scale(1.05); }
        }
        .cert-shine { animation: cert-shine 4.5s ease-in-out infinite; }
        .cert-seal { animation: cert-seal 5s ease-in-out infinite; }
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
        {/* brillo que recorre el certificado */}
        <div className="pointer-events-none absolute inset-y-0 w-1/3 cert-shine bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* tricolore superior */}
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#009246]" />
          <div className="flex-1 bg-[#f8fdf8]" />
          <div className="flex-1 bg-[#ce2b37]" />
        </div>

        <div className="relative p-6">
          {/* marco interior tipo diploma */}
          <div className="rounded-2xl border border-verde-700/40 px-5 py-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-verde-400">
              Certificato di Livello
            </p>

            {/* Nivel + sello */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <span className="text-5xl font-extrabold tracking-tight text-verde-50">{levelLabel}</span>
              <span
                className="cert-seal grid h-14 w-14 place-items-center rounded-full text-2xl"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #d4af37 0%, #b8860b 55%, #8a6508 100%)',
                  boxShadow: '0 6px 16px -4px rgba(212,175,55,0.6), inset 0 1px 2px rgba(255,255,255,0.4)',
                }}
                aria-hidden
              >
                🏅
              </span>
            </div>

            <p className="mt-4 text-sm font-medium text-verde-200">
              Quadro Comune Europeo
            </p>

            {/* firma */}
            <div className="mt-6 flex items-end justify-between gap-3">
              <div className="text-left">
                <div className="h-px w-24 bg-verde-600/60" />
                <p className="mt-1 text-[9px] uppercase tracking-widest text-verde-500">Italianto</p>
              </div>
              <p className="font-mono text-[10px] tracking-tight text-verde-500">IT-{levelLabel}-✓</p>
            </div>
          </div>
        </div>

        {/* tricolore inferior */}
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#009246]" />
          <div className="flex-1 bg-[#f8fdf8]" />
          <div className="flex-1 bg-[#ce2b37]" />
        </div>
      </div>
    </div>
  )
}
