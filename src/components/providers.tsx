'use client'

import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/contexts/language-context'

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
        {children}
      </LanguageProvider>
    </ThemeProvider>
  )
}
