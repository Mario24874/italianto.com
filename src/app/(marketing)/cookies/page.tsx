import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Cookies — Italianto',
  description: 'Información sobre el uso de cookies en la plataforma Italianto.',
}

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-bg-dark pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-verde-50 mb-3">Política de Cookies</h1>
          <p className="text-sm text-verde-600">Última actualización: marzo 2026</p>
        </div>

        <div className="space-y-8 text-verde-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando
              los visitas. Se usan para recordar tus preferencias y mejorar tu experiencia de navegación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">Cookies que usamos</h2>

            <div className="space-y-4">
              <div className="rounded-xl border border-verde-900/40 bg-verde-950/20 p-5">
                <h3 className="text-base font-semibold text-verde-300 mb-2">Cookies esenciales</h3>
                <p className="text-sm">
                  Necesarias para el funcionamiento básico del sitio. Incluyen la cookie de sesión de
                  autenticación (Clerk) y las preferencias de idioma y tema. No pueden desactivarse.
                </p>
              </div>

              <div className="rounded-xl border border-verde-900/40 bg-verde-950/20 p-5">
                <h3 className="text-base font-semibold text-verde-300 mb-2">Cookies de preferencias</h3>
                <p className="text-sm">
                  Almacenan tus preferencias de idioma (<code className="text-verde-400">italianto-lang</code>)
                  y modo oscuro/claro. Persisten entre sesiones para que no tengas que configurarlos cada vez.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">Lo que NO hacemos</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>No usamos cookies de rastreo publicitario.</li>
              <li>No compartimos datos de cookies con terceros con fines comerciales.</li>
              <li>No usamos cookies de redes sociales para rastrearte fuera de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">Cómo controlar las cookies</h2>
            <p>
              Puedes controlar y eliminar cookies desde la configuración de tu navegador. Ten en cuenta que
              deshabilitar las cookies esenciales puede afectar el funcionamiento de la plataforma
              (por ejemplo, no podrás mantener la sesión iniciada).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">Contacto</h2>
            <p>
              Para preguntas sobre nuestra política de cookies, escríbenos a{' '}
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
