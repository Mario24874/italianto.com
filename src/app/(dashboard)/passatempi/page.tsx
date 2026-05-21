import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanType } from '@/lib/plans'
import { translations, type Language } from '@/lib/i18n'
import { Gamepad2 } from 'lucide-react'
import { PassatempiClient, type ActivityRow } from './_passatempi-client'

export const metadata: Metadata = { title: 'Passatempi — Italianto' }

const PLAN_HIERARCHY: PlanType[] = ['free', 'essenziale', 'avanzato', 'maestro']

export default async function PassatempiPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const cookieStore = await cookies()
  const lang = (cookieStore.get('italianto-lang')?.value ?? 'es') as Language
  const t = translations[lang] ?? translations.es

  const supabase = getSupabaseAdmin()
  const [activitiesResult, subResult] = await Promise.all([
    supabase
      .from('activities')
      .select('*')
      .eq('status', 'published')
      .order('order_index', { ascending: true }),
    supabase
      .from('subscriptions')
      .select('plan_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const activities = (activitiesResult.data ?? []) as ActivityRow[]
  const userPlan = (subResult.data?.plan_type ?? 'free') as PlanType

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-verde-50 flex items-center gap-3">
          <Gamepad2 size={28} className="text-amber-400" />
          {t.nav.games}
        </h1>
        <p className="text-verde-500 mt-1 text-sm">{t.passatempi.pageSubtitle}</p>
      </div>

      <PassatempiClient
        activities={activities}
        userPlan={userPlan}
        planHierarchy={PLAN_HIERARCHY}
      />
    </div>
  )
}
