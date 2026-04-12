'use client'

import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/contexts/language-context'
import { ClerkThemeProvider } from '@/components/clerk-theme-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <LanguageProvider>
        {/* ClerkThemeProvider is inside ThemeProvider so useTheme() works */}
        <ClerkThemeProvider>
          {children}
        </ClerkThemeProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
