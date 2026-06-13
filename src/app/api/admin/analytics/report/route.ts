import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchPageViews, aggregateBySection, uniqueVisitors } from '@/lib/analytics/queries'
import { toCSV } from '@/lib/analytics/csv'
import { ReportPDF } from '@/components/admin/analytics/report-pdf'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await requireAdmin()
  const sp = req.nextUrl.searchParams
  const scope = sp.get('scope') === 'user' ? 'user' : 'general'
  const format = sp.get('format') === 'csv' ? 'csv' : 'pdf'
  const userId = sp.get('userId') ?? undefined
  const now = Date.now()
  const fromISO = sp.get('from') ?? new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  const toISO = sp.get('to') ?? new Date(now).toISOString()

  if (scope === 'user' && !userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const rows = await fetchPageViews(fromISO, toISO, scope === 'user' ? userId : undefined)
  const sections = aggregateBySection(rows)

  let title = 'Reporte general de analítica'
  let subtitle = `Rango ${fromISO.slice(0, 10)} → ${toISO.slice(0, 10)}`
  if (scope === 'user') {
    const supabase = getSupabaseAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('users').select('email, full_name').eq('id', userId!).single()
    const u = data as { email: string; full_name: string | null } | null
    title = `Reporte de usuario — ${u?.full_name || u?.email || userId}`
    subtitle = `${u?.email ?? ''} · ${subtitle}`
  }

  const headers = { 'Cache-Control': 'no-store' }

  if (format === 'csv') {
    const csv = toCSV(
      ['entered_at', 'service', 'section', 'path', 'user_id', 'anon_id', 'duration_seconds'],
      rows.map(r => [r.entered_at, r.service, r.section, r.path, r.user_id ?? '', r.anon_id, r.duration_seconds ?? '']),
    )
    return new NextResponse(csv, {
      headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="reporte-${scope}.csv"` },
    })
  }

  const kpis = [
    { label: 'Visitas totales', value: String(rows.length) },
    { label: 'Visitantes únicos', value: String(uniqueVisitors(rows)) },
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(ReportPDF({ title, subtitle, kpis, sections }) as any)
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${scope}.pdf"` },
  })
}
