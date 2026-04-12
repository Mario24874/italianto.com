/**
 * Returns a signed upload URL so the browser can upload large files
 * (videos, subtitles) directly to Supabase Storage without routing through Next.js.
 *
 * Flow:
 *   1. Client POST { filename, contentType, folder }
 *   2. Server creates signed URL via service role
 *   3. Client PUT file to signedUrl
 *   4. Client stores publicUrl in form state
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const BUCKET = 'lesson-media'

async function ensureBucket(supabase: ReturnType<typeof getSupabaseAdmin>) {
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { filename, contentType, folder = 'videos' } = await req.json()

  if (!filename || !contentType) {
    return NextResponse.json({ error: 'filename y contentType son requeridos' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  await ensureBucket(supabase)

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${Date.now()}-${safe}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) {
    console.error('[upload-url]', error)
    return NextResponse.json({ error: 'No se pudo crear la URL de carga' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path,
    publicUrl,
  })
}
