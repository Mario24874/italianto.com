import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Banner estacional full-width — Mundial de fútbol 2026.
 * Enfoque temático/cultural: la pasión italiana por el calcio como gancho para
 * aprender el idioma. NO afirma que la selección italiana juegue el Mundial.
 * Texto fijo en español (estacional, fácil de retirar tras el Mundial).
 */
export function WorldCupBanner() {
  return (
    <section className="relative overflow-hidden bg-bg-dark">
      {/* Tricolore superior */}
      <div className="flex h-1">
        <div className="flex-1 bg-[#009246]" />
        <div className="flex-1 bg-[#f8fdf8]" />
        <div className="flex-1 bg-[#ce2b37]" />
      </div>

      <style>{`
        @keyframes wc-glow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes wc-shine {
          0%, 55% { transform: translateX(-140%) skewX(-18deg); }
          100% { transform: translateX(260%) skewX(-18deg); }
        }
        @keyframes wc-float {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50% { transform: translateY(-10px) rotate(-2deg); }
        }
        .wc-glow { animation: wc-glow 6s ease-in-out infinite; }
        .wc-shine { animation: wc-shine 5s ease-in-out infinite; }
        .wc-ball { animation: wc-float 7s ease-in-out infinite; }
      `}</style>

      {/* Atmósfera: gradiente de estadio + glows radiales */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(135deg, #06140a 0%, #0c2614 48%, #06120a 100%)' }}
      />
      <div
        className="wc-glow pointer-events-none absolute -top-24 left-[12%] h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(0,146,70,0.5) 0%, transparent 70%)' }}
      />
      <div
        className="wc-glow pointer-events-none absolute -bottom-28 right-[10%] h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(206,43,55,0.32) 0%, transparent 70%)', animationDelay: '1.5s' }}
      />
      {/* Líneas de "césped" diagonales muy sutiles */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
        style={{ backgroundImage: 'repeating-linear-gradient(115deg, #ffffff 0 2px, transparent 2px 64px)' }}
      />
      {/* Brillo que recorre el banner */}
      <div className="pointer-events-none absolute inset-y-0 z-0 w-1/4 wc-shine bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex flex-col items-center gap-7 text-center md:flex-row md:justify-between md:text-left">
          {/* Balón decorativo */}
          <div className="wc-ball order-2 md:order-1 shrink-0 select-none text-7xl sm:text-8xl drop-shadow-[0_12px_30px_rgba(0,146,70,0.4)]" aria-hidden>
            ⚽
          </div>

          <div className="order-1 md:order-2 md:flex-1 md:px-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ce2b37]/40 bg-[#ce2b37]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a93]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ce2b37] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ce2b37]" />
              </span>
              Mundial 2026 · 🇮🇹 Passione Azzurra
            </span>

            <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-verde-50 sm:text-5xl lg:text-6xl">
              Vive el Mundial en{' '}
              <span className="gradient-text-aurora">italiano</span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-verde-300/90 md:mx-0 sm:text-lg">
              Del <em className="not-italic font-semibold text-[#f8fdf8]">gol</em> al{' '}
              <em className="not-italic font-semibold text-[#f8fdf8]">fuoriclasse</em>: aprende el idioma del{' '}
              <span className="font-semibold text-verde-200">calcio</span> y siente la fiebre mundialista como un auténtico <span className="font-semibold text-verde-200">tifoso</span>.
            </p>
          </div>

          <div className="order-3 shrink-0">
            <Button size="xl" asChild className="px-8 text-base font-bold shadow-[0_18px_40px_-12px_rgba(0,146,70,0.6)]">
              <Link href="/sign-up">Empieza gratis ⚽</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tricolore inferior */}
      <div className="flex h-1">
        <div className="flex-1 bg-[#009246]" />
        <div className="flex-1 bg-[#f8fdf8]" />
        <div className="flex-1 bg-[#ce2b37]" />
      </div>
    </section>
  )
}
