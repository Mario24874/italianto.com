import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gift Card — Regala italiano',
  description:
    'Regala meses de Italianto: compra una gift card sin crear cuenta y la enviamos por correo con un código secreto. El regalo perfecto para quien sueña con hablar italiano.',
  alternates: { canonical: '/regalo' },
  openGraph: {
    title: 'Gift Card — Regala Italianto',
    description:
      'Regala meses de italiano con IA. Compra en minutos, sin cuenta, y la enviamos por correo con un código secreto.',
    url: '/regalo',
  },
}

export default function RegaloLayout({ children }: { children: React.ReactNode }) {
  return children
}
