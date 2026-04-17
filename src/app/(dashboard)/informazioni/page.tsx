import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType } from '@/lib/plans'
import Link from 'next/link'
import Image from 'next/image'
import { Info, Lock } from 'lucide-react'

export const metadata: Metadata = { title: 'Info Interessanti — Italianto' }

const PLAN_HIERARCHY: PlanType[] = ['free', 'essenziale', 'avanzato', 'maestro']
const CATEGORY_COLORS: Record<string, string> = {
  cultura:      'bg-blue-900/40 text-blue-300 border-blue-700/30',
  gastronomia:  'bg-orange-900/40 text-orange-300 border-orange-700/30',
  viajes:       'bg-cyan-900/40 text-cyan-300 border-cyan-700/30',
  historia:     'bg-yellow-900/40 text-yellow-300 border-yellow-700/30',
  arte:         'bg-pink-900/40 text-pink-300 border-pink-700/30',
  tradiciones:  'bg-purple-900/40 text-purple-300 border-purple-700/30',
  idioma:       'bg-verde-900/40 text-verde-300 border-verde-700/30',
}

function hasAccess(userPlan: PlanType, required: PlanType): boolean {
  return PLAN_HIERARCHY.indexOf(userPlan) >= PLAN_HIERARCHY.indexOf(required)
}

interface ArticleRow { id: string; slug: string; title: string; excerpt: string; image_url: string | null; category: string; level: string; plan_required: string }

export default async function InformazioniPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = getSupabaseAdmin()
  const [articlesResult, subResult] = await Promise.all([
    supabase.from('info_articles').select('id,slug,title,excerpt,image_url,category,level,plan_required').eq('status', 'published').order('order_index', { ascending: true }),
    supabase.from('subscriptions').select('plan_type').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
  ])

  const articles = (articlesResult.data ?? []) as ArticleRow[]
  const userPlan = (subResult.data?.plan_type ?? 'free') as PlanType

  const byCategory: Record<string, ArticleRow[]> = {}
  for (const art of articles) {
    if (!byCategory[art.category]) byCategory[art.category] = []
    byCategory[art.category].push(art)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-verde-50 flex items-center gap-3">
          <Info size={28} className="text-blue-400" />
          Info Interessanti
        </h1>
        <p className="text-verde-500 mt-1 text-sm">Curiosidades, cultura y datos sobre Italia e il italiano</p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20">
          <Info size={48} className="text-verde-800 mx-auto mb-4" />
          <p className="text-verde-500">Gli articoli arriveranno presto. Torna più tardi!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byCategory).map(([category, arts]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border capitalize ${CATEGORY_COLORS[category] ?? 'bg-verde-900/40 text-verde-300 border-verde-700/30'}`}>
                  {category}
                </span>
                <div className="flex-1 h-px bg-verde-900/40" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {arts.map(art => {
                  const accessible = hasAccess(userPlan, art.plan_required as PlanType)
                  return accessible ? (
                    <div key={art.id} className="rounded-2xl border border-verde-900/30 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50 transition-all overflow-hidden">
                      {art.image_url && (
                        <div className="relative h-32 w-full">
                          <Image src={art.image_url} alt={art.title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="font-semibold text-verde-200 mb-1">{art.title}</div>
                        {art.excerpt && <p className="text-xs text-verde-500 line-clamp-2">{art.excerpt}</p>}
                      </div>
                    </div>
                  ) : (
                    <div key={art.id} className="rounded-2xl border border-verde-900/20 bg-verde-950/10 opacity-60 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Lock size={14} className="text-verde-700 shrink-0" />
                        <div className="font-semibold text-verde-500 truncate">{art.title}</div>
                      </div>
                      <Link href="/impostazioni" className="text-xs text-verde-600 hover:text-verde-400 transition-colors">Upgrade para leer</Link>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
