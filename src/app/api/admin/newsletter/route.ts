import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { sendNewsletter, getAudienceContactCount } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const count = await getAudienceContactCount()
  return NextResponse.json({ subscriberCount: count })
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { subject?: string; html?: string; previewText?: string; name?: string }
  try { body = await req.json() } catch { body = {} }

  const { subject, html, previewText, name } = body
  if (!subject?.trim() || !html?.trim()) {
    return NextResponse.json({ error: 'subject y html son requeridos' }, { status: 400 })
  }

  try {
    const result = await sendNewsletter({ subject, html, previewText, name })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
