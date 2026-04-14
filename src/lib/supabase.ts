import { createClient } from '@supabase/supabase-js'

// Cliente público (browser, autenticado con anon key) — lazy para evitar error en build
let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase environment variables')
    _supabase = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return _supabase
}

// Alias para compatibilidad con código existente que usa `supabase` directamente
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  },
})

// Cliente de servicio (server-side, solo en API routes)
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _supabaseAdmin
}
