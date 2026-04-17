import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType } from '@/lib/plans'
import Link from 'next/link'
import { Download, Lock, FileText, Music, Video, Archive, ImageIcon, File } from 'lucide-react'

export const metadata: Metadata = { title: 'Download — Italianto' }

const PLAN_HIERARCHY: PlanType[] = ['free', 'essenziale', 'avanzato', 'maestro']
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  A2: 'bg-green-900/50 text-green-300 border-green-700/40',
  B1: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  B2: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
  C1: 'bg-red-900/50 text-red-300 border-red-700/40',
  C2: 'bg-purple-900/50 text-purple-300 border-purple-700/40',
}

function FileIcon({ type }: { type: string }) {
  const cls = 'text-cyan-400'
  if (type === 'pdf') return <FileText size={18} className={cls} />
  if (type === 'audio') return <Music size={18} className={cls} />
  if (type === 'video') return <Video size={18} className={cls} />
  if (type === 'zip') return <Archive size={18} className={cls} />
  if (type === 'image') return <ImageIcon size={18} className={cls} />
  return <File size={18} className={cls} />
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function hasAccess(userPlan: PlanType, required: PlanType): boolean {
  return PLAN_HIERARCHY.indexOf(userPlan) >= PLAN_HIERARCHY.indexOf(required)
}

interface DownloadRow { id: string; title: string; description: string; file_url: string; file_type: string; size_bytes: number | null; level: string; plan_required: string; download_count: number }

export default async function DownloadsPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = getSupabaseAdmin()
  const [downloadsResult, subResult] = await Promise.all([
    supabase.from('downloads').select('id,title,description,file_url,file_type,size_bytes,level,plan_required,download_count').eq('status', 'published').order('order_index', { ascending: true }),
    supabase.from('subscriptions').select('plan_type').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
  ])

  const downloads = (downloadsResult.data ?? []) as DownloadRow[]
  const userPlan = (subResult.data?.plan_type ?? 'free') as PlanType

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-verde-50 flex items-center gap-3">
          <Download size={28} className="text-cyan-400" />
          Download
        </h1>
        <p className="text-verde-500 mt-1 text-sm">Materiali scaricabili per studiare italiano</p>
      </div>

      {downloads.length === 0 ? (
        <div className="text-center py-20">
          <Download size={48} className="text-verde-800 mx-auto mb-4" />
          <p className="text-verde-500">I materiali arriveranno presto. Torna più tardi!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {downloads.map(dl => {
            const accessible = hasAccess(userPlan, dl.plan_required as PlanType)
            const size = formatSize(dl.size_bytes)
            return accessible ? (
              <div key={dl.id} className="flex items-center gap-4 p-4 rounded-2xl border border-verde-900/30 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center shrink-0">
                  <FileIcon type={dl.file_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-verde-200 truncate">{dl.title}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {dl.description && <span className="text-xs text-verde-500 truncate">{dl.description}</span>}
                    {size && <span className="text-xs text-verde-600 shrink-0">{size}</span>}
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shrink-0 ${LEVEL_COLORS[dl.level]}`}>{dl.level}</span>
                <a href={dl.file_url} target="_blank" rel="noopener noreferrer" download
                  className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan-900/30 border border-cyan-800/40 text-cyan-300 hover:bg-cyan-900/50 transition-colors">
                  <Download size={12} /> Descargar
                </a>
              </div>
            ) : (
              <div key={dl.id} className="flex items-center gap-4 p-4 rounded-2xl border border-verde-900/20 bg-verde-950/10 opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 rounded-xl bg-verde-900/20 flex items-center justify-center shrink-0">
                  <Lock size={16} className="text-verde-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-verde-500 truncate">{dl.title}</div>
                  {size && <div className="text-xs text-verde-700 mt-0.5">{size}</div>}
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shrink-0 ${LEVEL_COLORS[dl.level]}`}>{dl.level}</span>
                <Link href="/impostazioni" onClick={e => e.stopPropagation()} className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-verde-800/40 text-verde-500 hover:text-verde-300 hover:border-verde-600 transition-colors">
                  Upgrade
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
