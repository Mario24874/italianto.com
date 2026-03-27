import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Rutas que requieren autenticación
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/lezioni(.*)',
  '/canzoni(.*)',
  '/impostazioni(.*)',
  '/biblioteca-premium(.*)',
])

// Rutas que requieren rol de admin
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Proteger rutas de usuario autenticado
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Proteger rutas de admin
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }

    // Verificar admin via sessionClaims o header
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
    const userEmail = sessionClaims?.email as string | undefined

    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Excluir archivos estáticos y _next
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre incluir API routes
    '/(api|trpc)(.*)',
  ],
}
