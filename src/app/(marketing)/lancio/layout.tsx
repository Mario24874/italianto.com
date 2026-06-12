import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Oferta de Lanzamiento — 10% de descuento',
  description: 'Oferta especial de lanzamiento: 10% de descuento hasta el 30 de junio. Tutor IA, lecciones, canciones y mucho más.',
  alternates: { canonical: '/lancio' },
  openGraph: {
    title: 'Oferta de Lanzamiento — Italianto',
    description: 'Oferta especial de lanzamiento: 10% de descuento hasta el 30 de junio. Tutor IA, lecciones, canciones y mucho más.',
    url: '/lancio',
  },
}

export default function LancioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
