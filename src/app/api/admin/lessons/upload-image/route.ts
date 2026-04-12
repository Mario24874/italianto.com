import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const BUCKET = 'lesson-media'

async function ensureBucket(supabase: ReturnType<typeof getSupabaseAdmin>) {
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {/* already exists */})
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Error al leer el archivo' }, { status: 400 })
  }

  const file = formData.get('image') as File | null
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No se proporcionó ninguna imagen' }, { status: 400 })
  }

  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no soportado. Usa PNG, JPG, GIF o WebP.' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen es muy grande. Máximo 10 MB.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  await ensureBucket(supabase)

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) {
    console.error('[upload-image]', error)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
