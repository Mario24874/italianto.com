'use client'

import { useLanguage } from '@/contexts/language-context'
import { useLegalT } from '@/lib/legal-translations'

export default function PrivacidadPage() {
  const { lang } = useLanguage()
  const lt = useLegalT(lang)
  const p = lt.privacy

  return (
    <main className="min-h-screen bg-bg-dark pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-verde-50 mb-3">{p.title}</h1>
          <p className="text-sm text-verde-600">{lt.lastUpdated}</p>
        </div>

        <div className="space-y-8 text-verde-400 leading-relaxed">
          {p.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-verde-200 mb-3">{s.heading}</h2>
              {s.body && <p>{s.body}</p>}
              {s.list && (
                <ul className="list-disc list-inside space-y-1.5 mt-2">
                  {s.list.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              )}
              {s.body2 && <p className="mt-3">{s.body2}</p>}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
