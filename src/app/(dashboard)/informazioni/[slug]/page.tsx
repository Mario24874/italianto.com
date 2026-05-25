import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getServerLang } from '@/lib/lang-server'
import type { PlanType } from '@/lib/plans'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'

const PLAN_HIERARCHY: PlanType[] = ['free', 'essenziale', 'avanzato', 'maestro']

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  A2: 'bg-green-900/50 text-green-300 border-green-700/40',
  B1: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  B2: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
  C1: 'bg-red-900/50 text-red-300 border-red-700/40',
  C2: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
}

const CATEGORY_COLORS: Record<string, string> = {
  cultura:     'bg-blue-900/40 text-blue-300 border-blue-700/30',
  gastronomia: 'bg-orange-900/40 text-orange-300 border-orange-700/30',
  viajes:      'bg-cyan-900/40 text-cyan-300 border-cyan-700/30',
  historia:    'bg-yellow-900/40 text-yellow-300 border-yellow-700/30',
  arte:        'bg-pink-900/40 text-pink-300 border-pink-700/30',
  tradiciones: 'bg-purple-900/40 text-purple-300 border-purple-700/30',
  idioma:      'bg-verde-900/40 text-verde-300 border-verde-700/30',
}

interface ArticleRow {
  id: string
  slug: string
  title: string
  excerpt: string
  content_html: string
  image_url: string | null
  category: string
  level: string
  plan_required: string
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('info_articles')
    .select('title, level')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  const article = data as { title: string } | null
  return { title: article ? `${article.title} — Italianto` : 'Info Interessanti — Italianto' }
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const { t } = await getServerLang()
  const supabase = getSupabaseAdmin()

  const [articleResult, subResult] = await Promise.all([
    supabase
      .from('info_articles')
      .select('id,slug,title,excerpt,content_html,image_url,category,level,plan_required')
      .eq('slug', slug)
      .eq('status', 'published')
      .single(),
    supabase
      .from('subscriptions')
      .select('plan_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  if (!articleResult.data) notFound()
  const article = articleResult.data as ArticleRow
  const userPlan = (subResult.data?.plan_type ?? 'free') as PlanType

  const hasAccess = PLAN_HIERARCHY.indexOf(userPlan) >= PLAN_HIERARCHY.indexOf(article.plan_required as PlanType)
  if (!hasAccess) redirect('/impostazioni')

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Back link */}
      <Link
        href="/informazioni"
        className="flex items-center gap-1.5 text-sm text-verde-500 hover:text-verde-300 transition-colors w-fit"
      >
        <ChevronLeft size={16} />
        {t.informazioni.back}
      </Link>

      {/* Hero image */}
      {article.image_url && (
        <div className="relative h-52 w-full rounded-2xl overflow-hidden border border-verde-900/30">
          <Image src={article.image_url} alt={article.title} fill className="object-cover" />
        </div>
      )}

      {/* Metadata badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border capitalize ${CATEGORY_COLORS[article.category] ?? 'bg-verde-900/40 text-verde-300 border-verde-700/30'}`}>
          {article.category}
        </span>
        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${LEVEL_COLORS[article.level] ?? 'bg-verde-900/40 text-verde-300 border-verde-700/30'}`}>
          {article.level}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold text-verde-50">{article.title}</h1>

      {/* Excerpt */}
      {article.excerpt && (
        <p className="text-verde-400 text-base leading-relaxed border-l-2 border-verde-700/50 pl-4">
          {article.excerpt}
        </p>
      )}

      {/* Content */}
      {article.content_html && (
        <div
          className="prose prose-invert prose-verde max-w-none text-verde-200 leading-relaxed
            prose-headings:text-verde-100 prose-headings:font-bold
            prose-p:text-verde-300 prose-p:leading-relaxed
            prose-strong:text-verde-100
            prose-a:text-blue-400 prose-a:underline hover:prose-a:text-blue-300
            prose-ul:text-verde-300 prose-ol:text-verde-300
            prose-li:marker:text-verde-600
            prose-blockquote:border-verde-700 prose-blockquote:text-verde-400
            prose-code:text-verde-200 prose-code:bg-verde-950/50 prose-code:rounded prose-code:px-1"
          dangerouslySetInnerHTML={{ __html: article.content_html }}
        />
      )}
    </div>
  )
}
