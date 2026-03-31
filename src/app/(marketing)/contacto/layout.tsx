import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto',
  description: '¿Tienes preguntas sobre Italianto? Escríbenos y te responderemos a la brevedad. Estamos aquí para ayudarte a aprender italiano.',
  alternates: { canonical: '/contacto' },
  openGraph: {
    title: 'Contacto — Italianto',
    description: '¿Tienes preguntas? Contáctanos y te ayudamos a comenzar tu aprendizaje del italiano.',
    url: '/contacto',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
