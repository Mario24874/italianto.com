import { Badge } from '@/components/ui/badge'
import { Award } from 'lucide-react'
import { CertificateVisual } from './certificate-visual'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/**
 * Bloque informativo (sin CTA) — al completar cada nivel se entrega un
 * certificado. Reutiliza el lenguaje visual de la promo de gift cards.
 * Texto fijo en español. Se usa en home y /lancio.
 */
export function CertificatePromo() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-verde-700/30 to-transparent" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-3xl border border-verde-800/40 bg-gradient-to-br from-verde-950/60 via-bg-dark-2/80 to-bg-dark-2/40 p-8 sm:p-12 md:grid-cols-2">
          <div>
            <Badge variant="brand" className="mb-4">
              <Award size={11} /> Certificado oficial
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-verde-50 sm:text-4xl">
              Un certificado por cada nivel 🎓
            </h2>
            <p className="mt-4 max-w-md text-verde-400">
              Al completar cada nivel recibes un <span className="font-semibold text-verde-200">certificado digital de Italianto</span> que acredita tu progreso, siguiendo el Marco Común Europeo. De <strong className="text-verde-100">A1</strong> a <strong className="text-verde-100">C2</strong>.
            </p>

            {/* Niveles */}
            <div className="mt-6 flex flex-wrap gap-2">
              {LEVELS.map(lvl => (
                <span
                  key={lvl}
                  className="rounded-lg border border-verde-700/50 bg-verde-950/50 px-3 py-1 text-xs font-bold tracking-wide text-verde-200"
                >
                  {lvl}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <CertificateVisual levelLabel="B1" compact />
          </div>
        </div>
      </div>
    </section>
  )
}
