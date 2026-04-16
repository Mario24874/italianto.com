import { SignUp, ClerkLoading, ClerkLoaded } from '@clerk/nextjs'
import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Crear cuenta — Italianto',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex bg-bg-dark">
      {/* Left: Image */}
      <div className="hidden lg:block relative w-1/2">
        <Image
          src="/images/media/img/Coliseo.jfif"
          alt="Coliseo Romano"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-dark/20 to-bg-dark/70" />
        <div className="absolute top-1/2 -translate-y-1/2 left-12 max-w-sm space-y-4">
          <div className="text-3xl font-extrabold text-verde-50 leading-tight">
            Únete a miles de
            <br />
            <span className="gradient-text">estudiantes de italiano</span>
          </div>
          <div className="space-y-2.5">
            {[
              'Traductor inteligente',
              'Tutor AI conversacional',
              'Diálogos generados con IA',
              'Apps para todos los dispositivos',
            ].map(feat => (
              <div key={feat} className="flex items-center gap-2.5 text-sm text-verde-300">
                <div className="size-4 rounded-full bg-brand/30 border border-verde-700 flex items-center justify-center">
                  <div className="size-1.5 rounded-full bg-verde-400" />
                </div>
                {feat}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="relative size-9 overflow-hidden rounded-xl ring-1 ring-verde-800">
              <Image src="/logo_Italianto.png" alt="Italianto" fill className="object-cover" />
            </div>
            <span className="text-xl font-bold text-verde-100">Italianto</span>
          </div>
          <ClerkLoading>
            <div className="space-y-4 animate-pulse">
              <div className="h-10 rounded-xl bg-verde-950/60 w-full" />
              <div className="h-10 rounded-xl bg-verde-950/60 w-full" />
              <div className="flex items-center gap-3 my-2">
                <div className="h-px flex-1 bg-verde-900/40" />
                <div className="h-4 w-8 rounded bg-verde-950/40" />
                <div className="h-px flex-1 bg-verde-900/40" />
              </div>
              <div className="h-10 rounded-xl bg-verde-950/60 w-full" />
              <div className="h-10 rounded-xl bg-verde-950/60 w-full" />
              <div className="h-12 rounded-xl bg-brand/40 w-full" />
            </div>
          </ClerkLoading>
          <ClerkLoaded>
          <SignUp
            afterSignUpUrl="/dashboard"
            appearance={{
              variables: {
                colorBackground: '#0a0f0a',
                colorText: '#f0fdf1',
                colorTextSecondary: '#4ade5d',
                colorNeutral: '#f0fdf1',
                colorInputBackground: 'rgba(5, 46, 22, 0.5)',
                colorInputText: '#bbf7c2',
                colorPrimary: '#2e7d32',
                colorTextOnPrimaryBackground: '#ffffff',
              },
              elements: {
                rootBox: 'w-full',
                card: 'bg-[#0a0f0a] shadow-none border-0 p-0',
                headerTitle: 'text-verde-50 text-xl font-bold',
                headerSubtitle: 'text-verde-400',
                socialButtonsBlockButton: 'border border-verde-800 hover:border-verde-600 bg-verde-950/40 rounded-xl transition-all',
                socialButtonsBlockButtonText: 'text-verde-100',
                dividerLine: 'bg-verde-900/50',
                dividerText: 'text-verde-600',
                formFieldLabel: 'text-verde-400 text-sm',
                formFieldInput: 'bg-verde-950/50 border border-verde-800/50 text-verde-200 rounded-xl focus:border-verde-600',
                formButtonPrimary: 'bg-brand hover:bg-brand-light rounded-xl font-semibold shimmer-btn',
                footerActionLink: 'text-verde-400 hover:text-verde-300',
              },
            }}
          />
          </ClerkLoaded>
        </div>
      </div>
    </div>
  )
}
