import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Simple in-memory rate limiter: 5 req / IP / 60s
const rl = new Map<string, { count: number; reset: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rl.get(ip)
  if (!entry || now > entry.reset) {
    rl.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
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
