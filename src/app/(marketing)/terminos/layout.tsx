import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Servicio',
  description: 'Términos y condiciones de uso de Italianto. Conoce tus derechos y responsabilidades al usar nuestra plataforma de aprendizaje de italiano.',
  alternates: { canonical: '/terminos' },
  robots: { index: true, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
