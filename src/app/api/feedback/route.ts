import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, type = 'contact', name, email, phone } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    const validTypes = ['contact', 'comment', 'bug_report', 'feature_request']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'invalid type' }, { status: 400 })
    }

    const user = await currentUser().catch(() => null)

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('contact_messages').insert({
      user_id: user?.id ?? null,
      name: name || user?.fullName || user?.firstName || '',
      email: email || user?.emailAddresses?.[0]?.emailAddress || '',
      phone: phone ?? null,
      message: message.trim(),
      type,
      status: 'unread',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
