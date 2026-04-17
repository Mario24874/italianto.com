import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType } from '@/lib/plans'
import Link from 'next/link'
import { Video, Lock, Calendar, User, ExternalLink } from 'lucide-react'

export const metadata: Metadata = { title: 'Corsi dal Vivo — Italianto' }

const PLAN_HIERARCHY: PlanType[] = ['free', 'essenziale', 'avanzato', 'maestro']
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  A2: 'bg-green-900/50 text-green-300 border-green-700/40',
  B1: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  B2: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
  C1: 'bg-red-900/50 text-red-300 border-red-700/40',
  C2: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
}
const STATUS_COLORS: Record<string, string> = {
  published:  'bg-verde-900/40 text-verde-300 border-verde-700/30',
  full:       'bg-orange-900/40 text-orange-300 border-orange-700/30',
  cancelled:  'bg-red-900/40 text-red-300 border-red-700/30',
}
const STATUS_LABELS: Record<string, string> = { published: 'Disponible', full: 'Completo', cancelled: 'Cancelado' }

function hasAccess(userPlan: PlanType, required: PlanType): boolean {
  return PLAN_HIERARCHY.indexOf(userPlan) >= PLAN_HIERARCHY.indexOf(required)
}

interface CorsoRow { id: string; title: string; description: string; instructor: string; schedule_text: string; meeting_url: string | null; meeting_platform: string; level: string; plan_required: string; status: string; max_students: number | null }

export default async function CorsiPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = getSupabaseAdmin()
  const [corsiResult, subResult] = await Promise.all([
    supabase.from('corsi_dal_vivo').select('id,title,description,instructor,schedule_text,meeting_url,meeting_platform,level,plan_required,status,max_students').in('status', ['published','full']).order('order_index', { ascending: true }),
    supabase.from('subscriptions').select('plan_type').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
  ])

  const corsi = (corsiResult.data ?? []) as CorsoRow[]
  const userPlan = (subResult.data?.plan_type ?? 'free') as PlanType

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-verde-50 flex items-center gap-3">
          <Video size={28} className="text-purple-400" />
          Corsi dal Vivo
        </h1>
        <p className="text-verde-500 mt-1 text-sm">Clases en vivo con instructores nativos de italiano</p>
      </div>

      {corsi.length === 0 ? (
        <div className="text-center py-20">
          <Video size={48} className="text-verde-800 mx-auto mb-4" />
          <p className="text-verde-500">I corsi dal vivo arriveranno presto. Torna più tardi!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {corsi.map(corso => {
            const accessible = hasAccess(userPlan, corso.plan_required as PlanType)
            return (
              <div key={corso.id} className={`p-5 rounded-2xl border transition-all ${accessible ? 'border-verde-900/30 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50' : 'border-verde-900/20 bg-verde-950/10 opacity-60'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-800/30 flex items-center justify-center shrink-0">
                      {accessible ? <Video size={18} className="text-purple-400" /> : <Lock size={16} className="text-verde-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-verde-200">{corso.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${LEVEL_COLORS[corso.level]}`}>{corso.level}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[corso.status] ?? ''}`}>
                          {STATUS_LABELS[corso.status] ?? corso.status}
                        </span>
                      </div>
                      {corso.description && <p className="text-xs text-verde-500 mb-2">{corso.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-verde-500">
                        {corso.instructor && <span className="flex items-center gap-1"><User size={11} />{corso.instructor}</span>}
                        {corso.schedule_text && <span className="flex items-center gap-1"><Calendar size={11} />{corso.schedule_text}</span>}
                      </div>
                    </div>
                  </div>
                  {accessible && corso.meeting_url && corso.status === 'published' ? (
                    <a href={corso.meeting_url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold transition-colors">
                      <ExternalLink size={12} /> Unirme
                    </a>
                  ) : !accessible ? (
                    <Link href="/impostazioni" className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-verde-800/40 text-verde-500 hover:text-verde-300 hover:border-verde-600 transition-colors">
                      Upgrade
                    </Link>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
