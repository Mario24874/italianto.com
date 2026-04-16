'use client'

import { ClerkProvider } from '@clerk/nextjs'

/**
 * Wraps ClerkProvider with a stable appearance that does NOT depend on
 * resolvedTheme. Previously, tying appearance to useTheme() caused
 * ClerkProvider to receive new props on every theme change, which
 * interfered with Clerk initialization on slow mobile connections.
 *
 * Theme-specific styling is handled via CSS variables / Tailwind classes
 * on individual Clerk components (<SignIn>, <UserButton>, etc.) instead.
 */
export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#2e7d32',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'shadow-brand',
          formButtonPrimary: 'bg-brand hover:bg-brand-light shimmer-btn transition-all',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
