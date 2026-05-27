'use client'

import { useLanguage } from '@/contexts/language-context'

export function SignUpPromo() {
  const { t } = useLanguage()
  const { line1, line2, features } = t.signUpPromo

  return (
    <div className="top-1/2 -translate-y-1/2 left-12 max-w-sm space-y-4 absolute">
      <div className="text-3xl font-extrabold text-verde-50 leading-tight">
        {line1}
        <br />
        <span className="gradient-text">{line2}</span>
      </div>
      <div className="space-y-2.5">
        {features.map(feat => (
          <div key={feat} className="flex items-center gap-2.5 text-sm text-verde-300">
            <div className="size-4 rounded-full bg-brand/30 border border-verde-700 flex items-center justify-center">
              <div className="size-1.5 rounded-full bg-verde-400" />
            </div>
            {feat}
          </div>
        ))}
      </div>
    </div>
  )
}
