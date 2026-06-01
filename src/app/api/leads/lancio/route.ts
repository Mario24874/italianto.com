import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'

// SQL to create the table (run in Supabase Dashboard):
// CREATE TABLE IF NOT EXISTS leads (
//   id uuid default gen_random_uuid() primary key,
//   email text unique not null,
//   source text default 'lancio',
//   created_at timestamptz default now()
// );

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Italianto <noreply@italianto.com>'

const GUIDE_EMAIL_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0f0a;color:#e8f5e9;font-family:system-ui,sans-serif;margin:0;padding:0">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <img src="https://italianto.com/logo_Italianto.png" alt="Italianto" width="56" height="56"
        style="border-radius:14px;margin-bottom:12px">
      <h1 style="color:#81c784;font-size:20px;margin:0;font-weight:800">Italianto</h1>
      <p style="color:#4caf50;font-size:12px;margin:4px 0 0;letter-spacing:0.05em">
        SETTIMANA DI LANCIO
      </p>
    </div>

    <!-- Main card -->
    <div style="background:#132213;border:1px solid #1e3a1e;border-radius:20px;padding:32px;margin-bottom:24px">
      <div style="text-align:center;font-size:48px;margin-bottom:16px">🎁</div>
      <h2 style="color:#e8f5e9;font-size:22px;font-weight:800;margin:0 0 8px;text-align:center">
        ¡Tu guía está lista!
      </h2>
      <p style="color:#a5d6a7;font-size:15px;margin:0 0 24px;text-align:center;line-height:1.5">
        Los 100 verbos más usados en italiano con conjugaciones, ejemplos y pronunciación.
      </p>

      <!-- CTA button -->
      <a href="https://italianto.com/lancio/guia-verbos"
        style="display:block;background:linear-gradient(135deg,#2e7d32,#388e3c);color:#fff;
               text-decoration:none;border-radius:14px;padding:16px 24px;text-align:center;
               font-weight:800;font-size:16px;margin-bottom:12px;box-shadow:0 4px 16px rgba(46,125,50,0.4)">
        Ver la Guía de los 100 Verbos →
      </a>
      <p style="color:#4caf50;font-size:11px;text-align:center;margin:0">
        También puedes imprimirla como PDF desde la página
      </p>
    </div>

    <!-- Launch offer reminder -->
    <div style="background:#0a1a0a;border:1px solid #1b5e20;border-radius:14px;padding:20px;margin-bottom:24px">
      <p style="color:#66bb6a;font-size:13px;font-weight:700;margin:0 0 8px">
        🚀 Oferta de lanzamiento — Solo hasta el 9 de junio
      </p>
      <p style="color:#a5d6a7;font-size:13px;margin:0 0 12px;line-height:1.5">
        Usa el código <strong style="color:#fff;font-family:monospace;background:#1b3a1b;padding:2px 8px;border-radius:6px">LANCIO10</strong>
        al pagar cualquier plan y obtén <strong style="color:#81c784">10% de descuento</strong> en tu primer pago.
      </p>
      <a href="https://italianto.com/lancio#precios"
        style="display:inline-block;background:#1b3a1b;border:1px solid #2e7d32;color:#81c784;
               text-decoration:none;border-radius:10px;padding:10px 20px;
               font-weight:700;font-size:13px">
        Ver planes →
      </a>
    </div>

    <!-- What's in Italianto -->
    <div style="background:#132213;border:1px solid #1e3a1e;border-radius:14px;padding:20px;margin-bottom:24px">
      <p style="color:#81c784;font-size:13px;font-weight:700;margin:0 0 12px">
        ¿Qué encontrarás en Italianto?
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          ['🤖', 'Tutor IA Personal', 'Conversa en italiano con corrección en tiempo real'],
          ['📚', 'Lecciones A1→C2', 'Contenido estructurado en español, italiano e inglés'],
          ['🎵', 'Canzoni', 'Aprende cantando con letras y traducción sincronizada'],
          ['🎮', 'Passatempi', 'Crucigramas y juegos de vocabulario'],
        ].map(([icon, title, desc]) => `
        <tr>
          <td width="32" style="vertical-align:top;padding:0 8px 12px 0;font-size:20px">${icon}</td>
          <td style="padding-bottom:12px">
            <div style="color:#e8f5e9;font-size:13px;font-weight:700">${title}</div>
            <div style="color:#66bb6a;font-size:12px;line-height:1.4">${desc}</div>
          </td>
        </tr>`).join('')}
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align:center">
      <a href="https://italianto.com/sign-up"
        style="display:inline-block;background:#2e7d32;color:#fff;text-decoration:none;
               border-radius:12px;padding:14px 32px;font-weight:800;font-size:15px;margin-bottom:20px">
        Empieza gratis en Italianto
      </a>
      <p style="color:#2e7d32;font-size:11px;margin:0;line-height:1.6">
        © ${new Date().getFullYear()} Italianto ·
        <a href="https://italianto.com" style="color:#2e7d32">italianto.com</a>
        <br>
        Recibiste este email porque solicitaste la guía gratuita en italianto.com/lancio
      </p>
    </div>

  </div>
</body>
</html>`

export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string }
  const email = body.email?.toLowerCase().trim() ?? ''

  if (!email || !email.includes('@') || !email.includes('.')) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  let alreadyRegistered = false

  // 1. Save to Supabase
  try {
    const supabase = getSupabaseAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('leads')
      .upsert(
        { email, source: 'lancio' },
        { onConflict: 'email', ignoreDuplicates: true }
      )
    if (error) {
      // ignoreDuplicates returns null error for duplicates — this is a real error
      if (!error.message?.includes('duplicate') && !error.message?.includes('unique')) {
        console.error('[leads/lancio] supabase error:', error.message)
      } else {
        alreadyRegistered = true
      }
    }
  } catch (err) {
    console.error('[leads/lancio] supabase catch:', err)
  }

  // 2. Send guide email via Resend (always — even if already registered, they get the guide)
  if (resend) {
    try {
      const { error: sendError } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: '🎁 Tu Guía de los 100 Verbos Más Usados en Italiano',
        html: GUIDE_EMAIL_HTML,
      })
      if (sendError) {
        console.error('[leads/lancio] resend error:', sendError)
      }
    } catch (err) {
      console.error('[leads/lancio] resend catch:', err)
    }
  } else {
    console.warn('[leads/lancio] RESEND_API_KEY not set — email not sent')
  }

  return NextResponse.json({ ok: true, alreadyRegistered })
}
