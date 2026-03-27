import { auth, currentUser } from '@clerk/nextjs/server'

export async function isAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth()
    if (!userId) return false

    const user = await currentUser()
    if (!user) return false

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)

    const primaryEmail = user.emailAddresses.find(
      e => e.id === user.primaryEmailAddressId
    )?.emailAddress

    return !!primaryEmail && adminEmails.includes(primaryEmail)
  } catch {
    return false
  }
}

export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Unauthorized: Admin access required')
  }
}
