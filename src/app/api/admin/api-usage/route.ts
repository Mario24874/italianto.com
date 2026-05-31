import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const supabase = getSupabaseAdmin()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // All-time totals per API
    const { data: allTime } = await supabase
      .from('api_usage_log')
      .select('api, input_tokens, output_tokens, cost_usd')

    // Today totals
    const { data: today } = await supabase
      .from('api_usage_log')
      .select('api, input_tokens, output_tokens, cost_usd')
      .gte('created_at', todayStart.toISOString())

    // This month totals
    const { data: month } = await supabase
      .from('api_usage_log')
      .select('api, input_tokens, output_tokens, cost_usd')
      .gte('created_at', monthStart.toISOString())

    // Last 10 calls
    const { data: recent } = await supabase
      .from('api_usage_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    function aggregate(rows: typeof allTime) {
      if (!rows?.length) return { input_tokens: 0, output_tokens: 0, cost_usd: 0, by_api: {} as Record<string, { input: number; output: number; cost: number }> }
      const by_api: Record<string, { input: number; output: number; cost: number }> = {}
      let totalIn = 0, totalOut = 0, totalCost = 0
      for (const r of rows) {
        totalIn += r.input_tokens ?? 0
        totalOut += r.output_tokens ?? 0
        totalCost += Number(r.cost_usd ?? 0)
        const key = r.api as string
        if (!by_api[key]) by_api[key] = { input: 0, output: 0, cost: 0 }
        by_api[key].input += r.input_tokens ?? 0
        by_api[key].output += r.output_tokens ?? 0
        by_api[key].cost += Number(r.cost_usd ?? 0)
      }
      return { input_tokens: totalIn, output_tokens: totalOut, cost_usd: totalCost, by_api }
    }

    return NextResponse.json({
      all_time: aggregate(allTime),
      today: aggregate(today),
      month: aggregate(month),
      recent: recent ?? [],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Table might not exist yet — return empty stats instead of 500
    if (msg.includes('does not exist') || msg.includes('relation')) {
      return NextResponse.json({
        all_time: { input_tokens: 0, output_tokens: 0, cost_usd: 0, by_api: {} },
        today: { input_tokens: 0, output_tokens: 0, cost_usd: 0, by_api: {} },
        month: { input_tokens: 0, output_tokens: 0, cost_usd: 0, by_api: {} },
        recent: [],
        setup_required: true,
      })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
