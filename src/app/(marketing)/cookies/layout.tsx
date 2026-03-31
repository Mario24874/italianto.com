import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Información sobre el uso de cookies en Italianto. Usamos cookies para mejorar tu experiencia de aprendizaje del italiano.',
  alternates: { canonical: '/cookies' },
  robots: { index: true, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
