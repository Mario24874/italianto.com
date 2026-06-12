import { NextResponse } from 'next/server'

/**
 * GET /api/payments/manual-info
 *
 * Datos públicos para pagar por Pago Móvil o Zelle. Viven en env vars
 * (configurables en EasyPanel sin redeploy de código):
 *   PAGO_MOVIL_BANK, PAGO_MOVIL_PHONE, PAGO_MOVIL_ID  → Pago Móvil (Venezuela)
 *   ZELLE_EMAIL, ZELLE_NAME                            → Zelle (USD)
 * Un método solo se ofrece si todas sus variables están configuradas.
 */
export async function GET() {
  const pagoMovil =
    process.env.PAGO_MOVIL_BANK && process.env.PAGO_MOVIL_PHONE && process.env.PAGO_MOVIL_ID
      ? {
          bank: process.env.PAGO_MOVIL_BANK,
          phone: process.env.PAGO_MOVIL_PHONE,
          documentId: process.env.PAGO_MOVIL_ID,
        }
      : null

  const zelle =
    process.env.ZELLE_EMAIL && process.env.ZELLE_NAME
      ? {
          email: process.env.ZELLE_EMAIL,
          name: process.env.ZELLE_NAME,
        }
      : null

  return NextResponse.json({ pagoMovil, zelle })
}
