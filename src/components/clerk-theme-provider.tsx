'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { esES, itIT, enUS } from '@clerk/localizations'
import { useLanguage } from '@/contexts/language-context'

const clerkLocalizations = { es: esES, it: itIT, en: enUS }

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage()

  return (
    <ClerkProvider
      localization={clerkLocalizations[lang]}
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
