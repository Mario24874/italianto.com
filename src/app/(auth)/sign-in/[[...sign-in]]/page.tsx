import { SignIn } from '@clerk/nextjs'
import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Iniciar sesión — Italianto',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex bg-bg-dark">
      {/* Left: Image */}
      <div className="hidden lg:block relative w-1/2">
        <Image
          src="/images/media/img/LalanternaGenova.jfif"
          alt="La Lanterna di Genova"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-dark/20 to-bg-dark/70" />
        <div className="absolute bottom-12 left-12 max-w-sm">
          <div className="glass-dark rounded-2xl p-5">
            <div className="text-sm font-medium text-verde-300 italic mb-1">
              &ldquo;Il viaggio di mille miglia inizia con un primo passo.&rdquo;
            </div>
            <div className="text-xs text-verde-500">— Lao Tzu (traducción italiana)</div>
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
          <SignIn
            appearance={{
              variables: {
                colorBackground: 'transparent',
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
                card: 'bg-transparent shadow-none border-0 p-0',
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
                identityPreviewText: 'text-verde-300',
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
