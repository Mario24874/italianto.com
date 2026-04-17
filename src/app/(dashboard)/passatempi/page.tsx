import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType } from '@/lib/plans'
import Link from 'next/link'
import { Gamepad2, Lock, HelpCircle, Puzzle } from 'lucide-react'

export const metadata: Metadata = { title: 'Passatempi — Italianto' }

const PLAN_HIERARCHY: PlanType[] = ['free', 'essenziale', 'avanzato', 'maestro']
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  A2: 'bg-green-900/50 text-green-300 border-green-700/40',
  B1: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  B2: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
  C1: 'bg-red-900/50 text-red-300 border-red-700/40',
  C2: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
}
const TYPE_LABELS: Record<string, string> = { game: 'Juego', quiz: 'Quiz', puzzle: 'Puzzle', crossword: 'Crucigrama', wordmatch: 'Palabras' }

function hasAccess(userPlan: PlanType, required: PlanType): boolean {
  return PLAN_HIERARCHY.indexOf(userPlan) >= PLAN_HIERARCHY.indexOf(required)
}

interface ActivityRow { id: string; title: string; description: string; type: string; level: string; plan_required: string }

function TypeIcon({ type }: { type: string }) {
  if (type === 'quiz') return <HelpCircle size={16} className="text-amber-400" />
  if (type === 'puzzle' || type === 'crossword') return <Puzzle size={16} className="text-amber-400" />
  return <Gamepad2 size={16} className="text-amber-400" />
}

export default async function PassatempiPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = getSupabaseAdmin()
  const [activitiesResult, subResult] = await Promise.all([
    supabase.from('activities').select('id,title,description,type,level,plan_required').eq('status', 'published').order('order_index', { ascending: true }),
    supabase.from('subscriptions').select('plan_type').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
  ])

  const activities = (activitiesResult.data ?? []) as ActivityRow[]
  const userPlan = (subResult.data?.plan_type ?? 'free') as PlanType

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-verde-50 flex items-center gap-3">
          <Gamepad2 size={28} className="text-amber-400" />
          Passatempi
        </h1>
        <p className="text-verde-500 mt-1 text-sm">Juegos y actividades para practicar italiano</p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 size={48} className="text-verde-800 mx-auto mb-4" />
          <p className="text-verde-500">Le attività arriveranno presto. Torna più tardi!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activities.map(act => {
            const accessible = hasAccess(userPlan, act.plan_required as PlanType)
            return accessible ? (
              <div key={act.id} className="p-5 rounded-2xl border border-verde-900/30 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50 transition-all">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-950/40 border border-amber-800/30 flex items-center justify-center shrink-0">
                    <TypeIcon type={act.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-verde-200 truncate">{act.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium text-amber-400 bg-amber-950/30 border border-amber-800/30 px-2 py-0.5 rounded">
                        {TYPE_LABELS[act.type] ?? act.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${LEVEL_COLORS[act.level]}`}>{act.level}</span>
                    </div>
                  </div>
                </div>
                {act.description && <p className="text-xs text-verde-500 line-clamp-2">{act.description}</p>}
              </div>
            ) : (
              <div key={act.id} className="p-5 rounded-2xl border border-verde-900/20 bg-verde-950/10 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-verde-900/20 flex items-center justify-center shrink-0">
                    <Lock size={16} className="text-verde-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-verde-500 truncate">{act.title}</div>
                    <Link href="/impostazioni" className="text-[10px] text-verde-600 hover:text-verde-400 transition-colors">Upgrade para desbloquear</Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
