import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Meta custom audience CSV format: email, fn (first name), ln (last name)
// Meta hashes the values automatically on upload.
export async function GET() {
  await requireAdmin()

  const supabase = getSupabaseAdmin()
  const { data: users, error } = await supabase
    .from('users')
    .select('email, full_name')
    .order('created_at', { ascending: false }) as unknown as {
      data: Array<{ email: string | null; full_name: string | null }> | null
      error: { message: string } | null
    }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows: string[] = ['email,fn,ln']

  for (const u of users ?? []) {
    if (!u.email) continue
    const parts = (u.full_name ?? '').trim().split(/\s+/)
    const fn = parts[0] ?? ''
    const ln = parts.slice(1).join(' ')
    // Escape commas/quotes in name fields
    const esc = (s: string) => s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s
    rows.push(`${u.email},${esc(fn)},${esc(ln)}`)
  }

  const csv = rows.join('\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="italianto-usuarios-meta-${date}.csv"`,
    },
  })
}
