import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://italianto.com'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#organization`,
      name: 'Italianto',
      url: APP_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_URL}/logo_Italianto.png`,
      },
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'Italianto',
      description: 'La plataforma integral para aprender italiano con inteligencia artificial.',
      publisher: { '@id': `${APP_URL}/#organization` },
      inLanguage: ['es', 'it', 'en'],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Italianto',
      operatingSystem: 'Web, Android, iOS',
      applicationCategory: 'EducationApplication',
      offers: [
        {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          name: 'Plan Gratuito',
        },
        {
          '@type': 'Offer',
          price: '4.99',
          priceCurrency: 'USD',
          name: 'Plan Essenziale',
        },
        {
          '@type': 'Offer',
          price: '9.99',
          priceCurrency: 'USD',
          name: 'Plan Avanzato',
        },
      ],
      url: APP_URL,
    },
  ],
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-light dark:bg-bg-dark text-verde-900 dark:text-verde-100 transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
