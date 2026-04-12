'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { useTheme } from 'next-themes'

/**
 * Wraps ClerkProvider with theme-aware appearance so that the sign-in,
 * sign-up and user-button modals look correct in both dark and light mode.
 */
export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  // Default to dark on first render (before hydration resolvedTheme is undefined)
  const dark = resolvedTheme !== 'light'

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#2e7d32',
          colorBackground: dark ? '#060d07' : '#ffffff',
          colorText: dark ? '#f0fdf4' : '#14532d',
          colorTextSecondary: dark ? '#86ef93' : '#166534',
          colorInputBackground: dark ? '#0d1a0e' : '#f0faf0',
          colorInputText: dark ? '#f0fdf4' : '#14532d',
          colorNeutral: dark ? '#4ade5d' : '#15803d',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'glass-dark shadow-brand',
          socialButtonsBlockButton:
            'border border-verde-800 hover:border-verde-600 transition-colors',
          formButtonPrimary:
            'bg-brand hover:bg-brand-light shimmer-btn transition-all',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
