'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Loader2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Tutor {
  slug: string
  name: string
  description: string
  avatar_url: string | null
}


export function TutorSelector() {
  const router = useRouter()
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tutors')
      .then(r => r.json())
      .then(d => setTutors(d.tutors ?? []))
      .finally(() => setLoading(false))
  }, [])

  const select = (slug: string) => {
    setSelecting(slug)
    router.push(`/tutor/${slug}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin text-verde-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full px-4 py-8 max-w-2xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-verde-100">Scegli il tuo Tutor</h1>
        <p className="text-verde-500 text-sm mt-1">
          Ogni tutor ha uno stile e specializzazione diversi
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tutors.map(tutor => {
          const isSelecting = selecting === tutor.slug
          return (
            <button
              key={tutor.slug}
              onClick={() => select(tutor.slug)}
              disabled={!!selecting}
              className={cn(
                'flex items-start gap-4 p-4 rounded-2xl border text-left',
                'bg-verde-950/20 border-verde-900/40',
                'hover:bg-verde-900/30 hover:border-verde-700/60',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'transition-all group',
              )}
            >
              <div className="size-14 rounded-full overflow-hidden ring-2 ring-verde-800 shrink-0">
                {tutor.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tutor.avatar_url} alt={tutor.name} className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-verde-900/60 flex items-center justify-center">
                    <Bot size={22} className="text-verde-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-verde-100 mb-1">{tutor.name}</p>
                <p className="text-verde-500 text-xs leading-relaxed line-clamp-2">{tutor.description}</p>
              </div>

              <div className="shrink-0 mt-1">
                {isSelecting
                  ? <Loader2 size={16} className="animate-spin text-verde-400" />
                  : <ChevronRight size={16} className="text-verde-600 group-hover:text-verde-400 transition-colors" />
                }
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
