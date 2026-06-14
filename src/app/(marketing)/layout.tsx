import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ReviewWidget } from '@/components/marketing/review-widget'
import { VisitTracker } from '@/components/visit-tracker'
import { getSupabaseAdmin } from '@/lib/supabase'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://italianto.com'

// Perfiles sociales reales (también enlazados en la home y en /lancio).
const SOCIAL_PROFILES = [
  'https://www.instagram.com/italiantonline/',
  'https://www.youtube.com/@Italiantonline',
]

// Niveles CEFR cubiertos por el contenido (A1–C2). Cada nivel otorga certificado.
const COURSE_LEVELS = [
  { code: 'A1', name: 'Principiante' },
  { code: 'A2', name: 'Elemental' },
  { code: 'B1', name: 'Intermedio' },
  { code: 'B2', name: 'Intermedio Alto' },
  { code: 'C1', name: 'Avanzado' },
  { code: 'C2', name: 'Maestría' },
]

interface ReviewAgg { count: number; avg: number }

/**
 * Promedio y conteo de reseñas APROBADas para el aggregateRating del schema.
 * Falla ruidoso pero no rompe el render: si la consulta falla, se omite el
 * aggregateRating (mejor sin estrellas que con datos inventados o un 500).
 */
async function getReviewAgg(): Promise<ReviewAgg | null> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('platform_reviews')
      .select('rating')
      .eq('status', 'approved')
    if (error) throw error
    const ratings = (data ?? [])
      .map(r => (r as { rating: number }).rating)
      .filter((n): n is number => typeof n === 'number')
    if (ratings.length === 0) return null
    return { count: ratings.length, avg: ratings.reduce((a, b) => a + b, 0) / ratings.length }
  } catch (e) {
    console.error('[marketing-layout] no se pudo cargar aggregateRating de platform_reviews:', e)
    return null
  }
}

function buildJsonLd(reviewAgg: ReviewAgg | null) {
  const orgRef = { '@id': `${APP_URL}/#organization` }

  return {
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
        sameAs: SOCIAL_PROFILES,
      },
      {
        '@type': 'WebSite',
        '@id': `${APP_URL}/#website`,
        url: APP_URL,
        name: 'Italianto',
        description: 'La plataforma integral para aprender italiano con inteligencia artificial.',
        publisher: orgRef,
        inLanguage: ['es', 'it', 'en'],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Italianto',
        operatingSystem: 'Web, Android, iOS',
        applicationCategory: 'EducationApplication',
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Plan Gratuito' },
          { '@type': 'Offer', price: '4.99', priceCurrency: 'USD', name: 'Plan Essenziale' },
          { '@type': 'Offer', price: '9.99', priceCurrency: 'USD', name: 'Plan Avanzato' },
        ],
        url: APP_URL,
        ...(reviewAgg
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: reviewAgg.avg.toFixed(1),
                reviewCount: reviewAgg.count,
                bestRating: '5',
                worstRating: '1',
              },
            }
          : {}),
      },
      // Un curso por nivel CEFR, cada uno con certificado al completarlo.
      ...COURSE_LEVELS.map(level => ({
        '@type': 'Course',
        name: `Curso de Italiano ${level.code} — ${level.name}`,
        description: `Curso de italiano online de nivel ${level.code} (${level.name}) con lecciones interactivas, práctica de pronunciación, diálogos y tutor con IA. Incluye certificado al completar el nivel.`,
        provider: orgRef,
        inLanguage: 'es',
        educationalLevel: level.code,
        educationalCredentialAwarded: {
          '@type': 'EducationalOccupationalCredential',
          name: `Certificado Italianto de Italiano nivel ${level.code}`,
          credentialCategory: 'certificate',
        },
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
        },
      })),
    ],
  }
}

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const reviewAgg = await getReviewAgg()
  const jsonLd = buildJsonLd(reviewAgg)

  return (
    <div className="flex min-h-screen flex-col bg-bg-light dark:bg-bg-dark text-verde-900 dark:text-verde-100 transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VisitTracker />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ReviewWidget />
    </div>
  )
}
