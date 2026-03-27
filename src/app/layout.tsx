import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://italianto.com'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Italianto — Aprende Italiano con Inteligencia Artificial',
    template: '%s | Italianto',
  },
  description:
    'La plataforma integral para aprender italiano. Traductor, conjugador, práctica de pronunciación, diálogos con IA y tutor conversacional. Comienza gratis.',
  keywords: [
    'aprender italiano',
    'italiano online',
    'cursos de italiano',
    'traductor italiano',
    'conjugador italiano',
    'pronunciación italiana',
    'IA para aprender idiomas',
    'plataforma de italiano',
  ],
  authors: [{ name: 'Italianto', url: APP_URL }],
  creator: 'Italianto',
  publisher: 'Italianto',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    alternateLocale: ['it_IT', 'en_US'],
    url: APP_URL,
    siteName: 'Italianto',
    title: 'Italianto — Aprende Italiano con Inteligencia Artificial',
    description:
      'La plataforma integral para aprender italiano. Traductor, conjugador, práctica de pronunciación y tutor con IA.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Italianto — Plataforma de aprendizaje de italiano',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Italianto — Aprende Italiano con IA',
    description: 'La plataforma integral para aprender italiano.',
    images: ['/og-image.jpg'],
    creator: '@italiantoapp',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: APP_URL,
    languages: {
      'es-ES': `${APP_URL}/es`,
      'it-IT': `${APP_URL}/it`,
      'en-US': `${APP_URL}/en`,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fdf8' },
    { media: '(prefers-color-scheme: dark)', color: '#060d07' },
  ],
  width: 'device-width',
  initialScale: 1,
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#2e7d32',
          colorBackground: '#060d07',
          colorText: '#f0fdf4',
          colorInputBackground: '#0d1a0e',
          colorInputText: '#f0fdf4',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'glass-dark shadow-brand',
          socialButtonsBlockButton:
            'border border-verde-800 hover:border-verde-600 transition-colors',
          formButtonPrimary:
            'bg-brand hover:bg-brand-light shimmer-btn transition-all',
        },
      }}
    >
      <html lang="es" suppressHydrationWarning>
        <body
          className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
        >
          <Providers>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--color-bg-dark-2)',
                  border: '1px solid rgba(46, 125, 50, 0.3)',
                  color: '#f0fdf4',
                },
              }}
            />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
