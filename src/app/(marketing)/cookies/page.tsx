'use client'

import { useLanguage } from '@/contexts/language-context'
import { useLegalT } from '@/lib/legal-translations'

export default function CookiesPage() {
  const { lang } = useLanguage()
  const lt = useLegalT(lang)
  const c = lt.cookies

  return (
    <main className="min-h-screen bg-bg-dark pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-verde-50 mb-3">{c.title}</h1>
          <p className="text-sm text-verde-600">{lt.lastUpdated}</p>
        </div>

        <div className="space-y-8 text-verde-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">{c.what.heading}</h2>
            <p>{c.what.body}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-4">{c.types.heading}</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-verde-900/40 bg-verde-950/20 p-5">
                <h3 className="text-base font-semibold text-verde-300 mb-2">{c.types.essential.title}</h3>
                <p className="text-sm">{c.types.essential.body}</p>
              </div>
              <div className="rounded-xl border border-verde-900/40 bg-verde-950/20 p-5">
                <h3 className="text-base font-semibold text-verde-300 mb-2">{c.types.preferences.title}</h3>
                <p className="text-sm">{c.types.preferences.body}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">{c.no.heading}</h2>
            <ul className="list-disc list-inside space-y-1.5">
              {c.no.list.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">{c.control.heading}</h2>
            <p>{c.control.body}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">{c.contact.heading}</h2>
            <p>
              {c.contact.body.split('italiantonline@gmail.com')[0]}
              <a href="mailto:italiantonline@gmail.com" className="text-verde-400 hover:text-verde-300 underline">
                italiantonline@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
