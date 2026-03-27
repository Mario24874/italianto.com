import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/keep-alive
 *
 * Endpoint para prevenir que Supabase pause el proyecto gratuito.
 * Supabase pausa proyectos después de 7 días de inactividad.
 *
 * Configurar en cron-job.org para ejecutarse cada 3 días:
 *   URL:     https://italianto.com/api/keep-alive
 *   Método:  GET
 *   Header:  Authorization: Bearer <KEEP_ALIVE_SECRET>
 *   Schedule: "0 8 every-3-days" (cron-job.org)
 */
export async function GET(req: NextRequest) {
  const secret = process.env.KEEP_ALIVE_SECRET
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (secret && token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // Ejecutar una query trivial para mantener el proyecto activo
    const { error } = await supabase.rpc('keep_alive')

    if (error) {
      // Si la función RPC no existe, intentar una query básica
      const { error: fallbackError } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      if (fallbackError) throw fallbackError
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Supabase keep-alive ping successful',
    })
  } catch (err) {
    console.error('Keep-alive error:', err)
    return NextResponse.json(
      { error: 'Database ping failed', detail: String(err) },
      { status: 500 }
    )
  }
}
