import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Servicio — Italianto',
  description: 'Términos y condiciones de uso de la plataforma Italianto.',
}

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-bg-dark pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-verde-50 mb-3">Términos de Servicio</h1>
          <p className="text-sm text-verde-600">Última actualización: marzo 2026</p>
        </div>

        <div className="space-y-8 text-verde-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">1. Aceptación de los términos</h2>
            <p>
              Al acceder y usar Italianto, aceptas estar sujeto a estos Términos de Servicio. Si no estás de
              acuerdo con alguna parte de los términos, no puedes acceder al servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">2. Descripción del servicio</h2>
            <p>
              Italianto es una plataforma de aprendizaje de italiano que incluye herramientas de traducción,
              conjugación, práctica de pronunciación, generación de diálogos con inteligencia artificial y un
              tutor conversacional. El servicio se presta a través de la web y aplicaciones móviles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">3. Cuentas de usuario</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Debes proporcionar información veraz al registrarte.</li>
              <li>Eres responsable de mantener la confidencialidad de tu cuenta.</li>
              <li>Debes notificarnos inmediatamente ante cualquier uso no autorizado.</li>
              <li>Una cuenta es para uso personal, no compartida entre múltiples personas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">4. Suscripciones y pagos</h2>
            <p>
              Los planes de pago se facturan de forma mensual o anual según lo seleccionado. Los pagos se
              procesan de forma segura a través de Stripe. Puedes cancelar tu suscripción en cualquier momento;
              el acceso se mantendrá hasta el final del período pagado.
            </p>
            <p className="mt-3">
              No ofrecemos reembolsos por períodos parciales, excepto en casos donde lo exija la legislación
              aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">5. Uso aceptable</h2>
            <p>Te comprometes a no:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Usar el servicio para actividades ilegales o no autorizadas.</li>
              <li>Intentar acceder a funciones restringidas sin suscripción activa.</li>
              <li>Compartir, revender o redistribuir el acceso a la plataforma.</li>
              <li>Interferir con la seguridad o funcionamiento del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">6. Propiedad intelectual</h2>
            <p>
              Todo el contenido de Italianto — incluyendo textos, diseños, código, marca y logos — es propiedad
              de Italianto y está protegido por las leyes de propiedad intelectual aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">7. Limitación de responsabilidad</h2>
            <p>
              Italianto se proporciona "tal como está". No garantizamos resultados específicos de aprendizaje.
              No somos responsables por daños indirectos, incidentales o consecuentes derivados del uso del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">8. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios sustanciales
              serán notificados por email. El uso continuado del servicio tras los cambios implica la aceptación
              de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-verde-200 mb-3">9. Contacto</h2>
            <p>
              Para preguntas sobre estos términos, contáctanos en{' '}
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
