import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/quota-reset
 *
 * Resetea las quotas mensuales de todos los suscriptores activos.
 * Llamar el día 1 de cada mes via cron-job.org:
 *   Schedule: 5 0 1 * *  (00:05 AM el día 1)
 *   Header:   Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.rpc('reset_monthly_quotas')

    if (error) throw error

    console.log(`Quota reset: ${data} subscriptions updated`)

    return NextResponse.json({
      success: true,
      updated: data,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Quota reset error:', err)
    return NextResponse.json(
      { error: 'Reset failed', detail: String(err) },
      { status: 500 }
    )
  }
}
