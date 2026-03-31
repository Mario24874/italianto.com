import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre Nosotros',
  description: 'Conoce al equipo detrás de Italianto. Nuestra misión es hacer que aprender italiano sea accesible, efectivo y divertido para todos con el poder de la inteligencia artificial.',
  alternates: { canonical: '/sobre-nosotros' },
  openGraph: {
    title: 'Sobre Nosotros — Italianto',
    description: 'Conoce al equipo detrás de Italianto y nuestra misión de democratizar el aprendizaje del italiano con IA.',
    url: '/sobre-nosotros',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
