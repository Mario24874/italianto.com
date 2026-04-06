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

  // Proteger rutas de admin: solo verificar autenticación en middleware.
  // La autorización por email se valida en cada página con requireAdmin().
  if (isAdminRoute(req)) {
    const { userId } = await auth()

    if (!userId) {
      // Use forwarded host/proto to build the public URL (avoids 0.0.0.0:3000 leaking from Docker)
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'italianto.com'
      const proto = req.headers.get('x-forwarded-proto') || 'https'
      const publicBase = `${proto}://${host}`
      const signInUrl = new URL('/sign-in', publicBase)
      signInUrl.searchParams.set('redirect_url', `${publicBase}${req.nextUrl.pathname}`)
      return NextResponse.redirect(signInUrl)
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
