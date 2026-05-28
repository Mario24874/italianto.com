import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { addContactToAudience } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  const { data: users, error } = await supabase
    .from('users')
    .select('email, full_name')
    .not('email', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let synced = 0
  let skipped = 0
  const errors: string[] = []

  for (const user of users ?? []) {
    if (!user.email) { skipped++; continue }
    const firstName = user.full_name?.split(' ')[0] ?? ''
    try {
      await addContactToAudience(user.email, firstName)
      synced++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Duplicate contacts are expected — count as synced
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        synced++
      } else {
        errors.push(`${user.email}: ${msg}`)
        skipped++
      }
    }
  }

  return NextResponse.json({ synced, skipped, errors })
}
