import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Endpoint temporal para diagnosticar acceso admin.
// BORRAR después de verificar.
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'not authenticated' }, { status: 401 })

  const user = await currentUser()
  const primaryEmail = user?.emailAddresses.find(
    e => e.id === user.primaryEmailAddressId
  )?.emailAddress

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)

  return NextResponse.json({
    userId,
    primaryEmail,
    adminEmails,
    isAdmin: !!primaryEmail && adminEmails.includes(primaryEmail),
    ADMIN_EMAILS_env: process.env.ADMIN_EMAILS || '(not set)',
  })
}
