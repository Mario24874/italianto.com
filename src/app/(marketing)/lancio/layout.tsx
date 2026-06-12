import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offerta di Lancio — Italianto: Aprende Italiano con IA',
  description: 'Oferta especial de lanzamiento: 10% de descuento hasta el 30 de junio. Tutor IA, lecciones, canciones y mucho más.',
}

export default function LancioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
