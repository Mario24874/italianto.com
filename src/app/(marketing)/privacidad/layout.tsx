import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Lee nuestra política de privacidad. En Italianto protegemos tus datos personales y nunca los compartimos con terceros sin tu consentimiento.',
  alternates: { canonical: '/privacidad' },
  robots: { index: true, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
