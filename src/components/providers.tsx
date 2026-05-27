'use client'

import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/contexts/language-context'
import { ClerkThemeProvider } from '@/components/clerk-theme-provider'
import { MusicPlayerProvider } from '@/contexts/music-player-context'

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
        <ClerkThemeProvider>
          <MusicPlayerProvider>
            {children}
          </MusicPlayerProvider>
        </ClerkThemeProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
