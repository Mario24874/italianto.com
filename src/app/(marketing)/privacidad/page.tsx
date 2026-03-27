import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Italianto',
  description: 'Política de privacidad de Italianto. Cómo recopilamos, usamos y protegemos tu información personal.',
}

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-bg-dark pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-verde-50 mb-3">Política de Privacidad</h1>
          <p className="text-sm text-verde-600">Última actualización: marzo 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-verde-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">1. Información que recopilamos</h2>
            <p>
              Italianto recopila la información que tú nos proporcionas directamente al registrarte, como tu
              nombre y dirección de correo electrónico. También recopilamos información sobre el uso de la plataforma,
              como las funciones que utilizas y el tiempo de sesión, con el fin de mejorar la experiencia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">2. Cómo usamos tu información</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Para crear y gestionar tu cuenta en la plataforma.</li>
              <li>Para procesar pagos y gestionar suscripciones a través de Stripe.</li>
              <li>Para enviarte comunicaciones relacionadas con el servicio (no spam comercial).</li>
              <li>Para mejorar la plataforma en base al uso agregado y anónimo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">3. Servicios de terceros</h2>
            <p>Italianto utiliza los siguientes servicios de terceros para operar:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-verde-300">Clerk</strong> — Autenticación e identidad de usuarios.</li>
              <li><strong className="text-verde-300">Stripe</strong> — Procesamiento seguro de pagos.</li>
              <li><strong className="text-verde-300">Supabase</strong> — Almacenamiento de datos de usuario.</li>
            </ul>
            <p className="mt-3">
              Cada uno de estos servicios tiene su propia política de privacidad. No vendemos ni compartimos
              tu información personal con terceros con fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">4. Cookies</h2>
            <p>
              Utilizamos cookies esenciales para mantener tu sesión iniciada y recordar tus preferencias de idioma
              y tema. No utilizamos cookies de rastreo publicitario de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">5. Tus derechos</h2>
            <p>
              Tienes derecho a acceder, rectificar o eliminar tus datos en cualquier momento. Para ejercer estos
              derechos, escríbenos a{' '}
              <a href="mailto:italiantonline@gmail.com" className="text-verde-400 hover:text-verde-300 underline">
                italiantonline@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">6. Seguridad</h2>
            <p>
              Tomamos medidas razonables para proteger tu información. Las contraseñas nunca se almacenan en texto
              plano y toda la comunicación ocurre a través de conexiones cifradas (HTTPS).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">7. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política, contáctanos en{' '}
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
