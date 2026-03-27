import type { Language } from '@/contexts/language-context'

export const legalTranslations = {
  es: {
    lastUpdated: 'Última actualización: marzo 2026',
    privacy: {
      title: 'Política de Privacidad',
      sections: [
        {
          heading: '1. Información que recopilamos',
          body: 'Italianto recopila la información que tú nos proporcionas directamente al registrarte, como tu nombre y dirección de correo electrónico. También recopilamos información sobre el uso de la plataforma, como las funciones que utilizas y el tiempo de sesión, con el fin de mejorar la experiencia.',
        },
        {
          heading: '2. Cómo usamos tu información',
          list: [
            'Para crear y gestionar tu cuenta en la plataforma.',
            'Para procesar pagos y gestionar suscripciones a través de Stripe.',
            'Para enviarte comunicaciones relacionadas con el servicio (no spam comercial).',
            'Para mejorar la plataforma en base al uso agregado y anónimo.',
          ],
        },
        {
          heading: '3. Servicios de terceros',
          body: 'Italianto utiliza los siguientes servicios de terceros para operar:',
          list: [
            'Clerk — Autenticación e identidad de usuarios.',
            'Stripe — Procesamiento seguro de pagos.',
            'Supabase — Almacenamiento de datos de usuario.',
          ],
          body2: 'Cada uno de estos servicios tiene su propia política de privacidad. No vendemos ni compartimos tu información personal con terceros con fines comerciales.',
        },
        {
          heading: '4. Cookies',
          body: 'Utilizamos cookies esenciales para mantener tu sesión iniciada y recordar tus preferencias de idioma y tema. No utilizamos cookies de rastreo publicitario de terceros.',
        },
        {
          heading: '5. Tus derechos',
          body: 'Tienes derecho a acceder, rectificar o eliminar tus datos en cualquier momento. Para ejercer estos derechos, escríbenos a italiantonline@gmail.com.',
        },
        {
          heading: '6. Seguridad',
          body: 'Tomamos medidas razonables para proteger tu información. Las contraseñas nunca se almacenan en texto plano y toda la comunicación ocurre a través de conexiones cifradas (HTTPS).',
        },
        {
          heading: '7. Contacto',
          body: 'Si tienes preguntas sobre esta política, contáctanos en italiantonline@gmail.com.',
        },
      ],
    },
    terms: {
      title: 'Términos de Servicio',
      sections: [
        { heading: '1. Aceptación de los términos', body: 'Al acceder y usar Italianto, aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de los términos, no puedes acceder al servicio.' },
        { heading: '2. Descripción del servicio', body: 'Italianto es una plataforma de aprendizaje de italiano que incluye herramientas de traducción, conjugación, práctica de pronunciación, generación de diálogos con inteligencia artificial y un tutor conversacional. El servicio se presta a través de la web y aplicaciones móviles.' },
        {
          heading: '3. Cuentas de usuario',
          list: [
            'Debes proporcionar información veraz al registrarte.',
            'Eres responsable de mantener la confidencialidad de tu cuenta.',
            'Debes notificarnos inmediatamente ante cualquier uso no autorizado.',
            'Una cuenta es para uso personal, no compartida entre múltiples personas.',
          ],
        },
        { heading: '4. Suscripciones y pagos', body: 'Los planes de pago se facturan de forma mensual o anual según lo seleccionado. Los pagos se procesan de forma segura a través de Stripe. Puedes cancelar tu suscripción en cualquier momento; el acceso se mantendrá hasta el final del período pagado. No ofrecemos reembolsos por períodos parciales, excepto en casos donde lo exija la legislación aplicable.' },
        {
          heading: '5. Uso aceptable',
          body: 'Te comprometes a no:',
          list: [
            'Usar el servicio para actividades ilegales o no autorizadas.',
            'Intentar acceder a funciones restringidas sin suscripción activa.',
            'Compartir, revender o redistribuir el acceso a la plataforma.',
            'Interferir con la seguridad o funcionamiento del servicio.',
          ],
        },
        { heading: '6. Propiedad intelectual', body: 'Todo el contenido de Italianto — incluyendo textos, diseños, código, marca y logos — es propiedad de Italianto y está protegido por las leyes de propiedad intelectual aplicables.' },
        { heading: '7. Limitación de responsabilidad', body: 'Italianto se proporciona "tal como está". No garantizamos resultados específicos de aprendizaje. No somos responsables por daños indirectos, incidentales o consecuentes derivados del uso del servicio.' },
        { heading: '8. Modificaciones', body: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios sustanciales serán notificados por email. El uso continuado del servicio tras los cambios implica la aceptación de los nuevos términos.' },
        { heading: '9. Contacto', body: 'Para preguntas sobre estos términos, contáctanos en italiantonline@gmail.com.' },
      ],
    },
    cookies: {
      title: 'Política de Cookies',
      what: { heading: '¿Qué son las cookies?', body: 'Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los visitas. Se usan para recordar tus preferencias y mejorar tu experiencia de navegación.' },
      types: {
        heading: 'Cookies que usamos',
        essential: { title: 'Cookies esenciales', body: 'Necesarias para el funcionamiento básico del sitio. Incluyen la cookie de sesión de autenticación (Clerk) y las preferencias de idioma y tema. No pueden desactivarse.' },
        preferences: { title: 'Cookies de preferencias', body: 'Almacenan tus preferencias de idioma (italianto-lang) y modo oscuro/claro. Persisten entre sesiones para que no tengas que configurarlos cada vez.' },
      },
      no: { heading: 'Lo que NO hacemos', list: ['No usamos cookies de rastreo publicitario.', 'No compartimos datos de cookies con terceros con fines comerciales.', 'No usamos cookies de redes sociales para rastrearte fuera de la plataforma.'] },
      control: { heading: 'Cómo controlar las cookies', body: 'Puedes controlar y eliminar cookies desde la configuración de tu navegador. Ten en cuenta que deshabilitar las cookies esenciales puede afectar el funcionamiento de la plataforma (por ejemplo, no podrás mantener la sesión iniciada).' },
      contact: { heading: 'Contacto', body: 'Para preguntas sobre nuestra política de cookies, contáctanos en italiantonline@gmail.com.' },
    },
  },
  it: {
    lastUpdated: 'Ultimo aggiornamento: marzo 2026',
    privacy: {
      title: 'Informativa sulla Privacy',
      sections: [
        { heading: '1. Informazioni che raccogliamo', body: "Italianto raccoglie le informazioni che ci fornisci direttamente durante la registrazione, come il tuo nome e indirizzo email. Raccogliamo anche informazioni sull'utilizzo della piattaforma, come le funzionalità che usi e il tempo di sessione, per migliorare l'esperienza." },
        {
          heading: '2. Come usiamo le tue informazioni',
          list: [
            'Per creare e gestire il tuo account sulla piattaforma.',
            'Per elaborare i pagamenti e gestire gli abbonamenti tramite Stripe.',
            'Per inviarti comunicazioni relative al servizio (non spam commerciale).',
            "Per migliorare la piattaforma in base all'utilizzo aggregato e anonimo.",
          ],
        },
        {
          heading: '3. Servizi di terze parti',
          body: 'Italianto utilizza i seguenti servizi di terze parti per operare:',
          list: [
            'Clerk — Autenticazione e identità degli utenti.',
            'Stripe — Elaborazione sicura dei pagamenti.',
            'Supabase — Archiviazione dei dati utente.',
          ],
          body2: 'Ognuno di questi servizi ha la propria informativa sulla privacy. Non vendiamo né condividiamo le tue informazioni personali con terze parti a fini commerciali.',
        },
        { heading: '4. Cookie', body: 'Utilizziamo cookie essenziali per mantenere la tua sessione attiva e ricordare le tue preferenze di lingua e tema. Non utilizziamo cookie di tracciamento pubblicitario di terze parti.' },
        { heading: '5. I tuoi diritti', body: 'Hai il diritto di accedere, rettificare o eliminare i tuoi dati in qualsiasi momento. Per esercitare questi diritti, scrivici a italiantonline@gmail.com.' },
        { heading: '6. Sicurezza', body: 'Adottiamo misure ragionevoli per proteggere le tue informazioni. Le password non vengono mai archiviate in testo normale e tutte le comunicazioni avvengono tramite connessioni crittografate (HTTPS).' },
        { heading: '7. Contatti', body: "Per domande su questa informativa, contattaci all'indirizzo italiantonline@gmail.com." },
      ],
    },
    terms: {
      title: 'Termini di Servizio',
      sections: [
        { heading: '1. Accettazione dei termini', body: "Accedendo e utilizzando Italianto, accetti di essere vincolato da questi Termini di Servizio. Se non sei d'accordo con qualsiasi parte dei termini, non puoi accedere al servizio." },
        { heading: '2. Descrizione del servizio', body: "Italianto è una piattaforma per l'apprendimento dell'italiano che include strumenti di traduzione, coniugazione, pratica di pronuncia, generazione di dialoghi con intelligenza artificiale e un tutor conversazionale. Il servizio è fornito tramite web e applicazioni mobili." },
        {
          heading: '3. Account utente',
          list: [
            'Devi fornire informazioni veritiere durante la registrazione.',
            'Sei responsabile del mantenimento della riservatezza del tuo account.',
            'Devi notificarci immediatamente in caso di utilizzo non autorizzato.',
            "Un account è per uso personale, non condiviso tra più persone.",
          ],
        },
        { heading: '4. Abbonamenti e pagamenti', body: 'I piani a pagamento vengono fatturati mensilmente o annualmente in base a quanto selezionato. I pagamenti vengono elaborati in modo sicuro tramite Stripe. Puoi cancellare il tuo abbonamento in qualsiasi momento; l\'accesso verrà mantenuto fino alla fine del periodo pagato. Non offriamo rimborsi per periodi parziali, salvo nei casi in cui la legislazione applicabile lo richieda.' },
        {
          heading: '5. Uso accettabile',
          body: 'Ti impegni a non:',
          list: [
            'Utilizzare il servizio per attività illegali o non autorizzate.',
            'Tentare di accedere a funzionalità riservate senza abbonamento attivo.',
            "Condividere, rivendere o ridistribuire l'accesso alla piattaforma.",
            'Interferire con la sicurezza o il funzionamento del servizio.',
          ],
        },
        { heading: '6. Proprietà intellettuale', body: 'Tutti i contenuti di Italianto — inclusi testi, design, codice, marchio e loghi — sono di proprietà di Italianto e sono protetti dalle leggi applicabili sulla proprietà intellettuale.' },
        { heading: '7. Limitazione di responsabilità', body: 'Italianto è fornito "così com\'è". Non garantiamo risultati specifici di apprendimento. Non siamo responsabili per danni indiretti, incidentali o conseguenti derivanti dall\'utilizzo del servizio.' },
        { heading: '8. Modifiche', body: 'Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. Le modifiche sostanziali saranno notificate via email. L\'uso continuato del servizio dopo le modifiche implica l\'accettazione dei nuovi termini.' },
        { heading: '9. Contatti', body: 'Per domande su questi termini, contattaci a italiantonline@gmail.com.' },
      ],
    },
    cookies: {
      title: 'Informativa sui Cookie',
      what: { heading: 'Cosa sono i cookie?', body: 'I cookie sono piccoli file di testo che i siti web memorizzano sul tuo dispositivo quando li visiti. Vengono utilizzati per ricordare le tue preferenze e migliorare la tua esperienza di navigazione.' },
      types: {
        heading: 'Cookie che utilizziamo',
        essential: { title: 'Cookie essenziali', body: 'Necessari per il funzionamento di base del sito. Includono il cookie di sessione di autenticazione (Clerk) e le preferenze di lingua e tema. Non possono essere disattivati.' },
        preferences: { title: 'Cookie di preferenze', body: 'Memorizzano le tue preferenze di lingua (italianto-lang) e modalità scura/chiara. Persistono tra le sessioni in modo che non debba configurarle ogni volta.' },
      },
      no: { heading: 'Cosa NON facciamo', list: ['Non utilizziamo cookie di tracciamento pubblicitario.', 'Non condividiamo dati dei cookie con terze parti a fini commerciali.', 'Non utilizziamo cookie di social network per tracciarti al di fuori della piattaforma.'] },
      control: { heading: 'Come controllare i cookie', body: 'Puoi controllare ed eliminare i cookie dalle impostazioni del tuo browser. Tieni presente che disabilitare i cookie essenziali può influire sul funzionamento della piattaforma (ad esempio, non potrai mantenere la sessione attiva).' },
      contact: { heading: 'Contatti', body: 'Per domande sulla nostra informativa sui cookie, contattaci a italiantonline@gmail.com.' },
    },
  },
  en: {
    lastUpdated: 'Last updated: March 2026',
    privacy: {
      title: 'Privacy Policy',
      sections: [
        { heading: '1. Information we collect', body: 'Italianto collects information you provide directly when registering, such as your name and email address. We also collect information about platform usage, such as the features you use and session time, to improve the experience.' },
        {
          heading: '2. How we use your information',
          list: [
            'To create and manage your account on the platform.',
            'To process payments and manage subscriptions through Stripe.',
            'To send you service-related communications (no commercial spam).',
            'To improve the platform based on aggregated and anonymous usage.',
          ],
        },
        {
          heading: '3. Third-party services',
          body: 'Italianto uses the following third-party services to operate:',
          list: [
            'Clerk — User authentication and identity.',
            'Stripe — Secure payment processing.',
            'Supabase — User data storage.',
          ],
          body2: 'Each of these services has its own privacy policy. We do not sell or share your personal information with third parties for commercial purposes.',
        },
        { heading: '4. Cookies', body: 'We use essential cookies to keep your session active and remember your language and theme preferences. We do not use third-party advertising tracking cookies.' },
        { heading: '5. Your rights', body: 'You have the right to access, rectify or delete your data at any time. To exercise these rights, write to us at italiantonline@gmail.com.' },
        { heading: '6. Security', body: 'We take reasonable measures to protect your information. Passwords are never stored in plain text and all communication occurs through encrypted connections (HTTPS).' },
        { heading: '7. Contact', body: 'If you have questions about this policy, contact us at italiantonline@gmail.com.' },
      ],
    },
    terms: {
      title: 'Terms of Service',
      sections: [
        { heading: '1. Acceptance of terms', body: 'By accessing and using Italianto, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.' },
        { heading: '2. Service description', body: 'Italianto is an Italian learning platform that includes translation, conjugation, pronunciation practice, AI-generated dialogue and a conversational tutor. The service is provided via web and mobile applications.' },
        {
          heading: '3. User accounts',
          list: [
            'You must provide truthful information when registering.',
            'You are responsible for maintaining the confidentiality of your account.',
            'You must notify us immediately of any unauthorized use.',
            'An account is for personal use, not shared between multiple people.',
          ],
        },
        { heading: '4. Subscriptions and payments', body: 'Paid plans are billed monthly or annually as selected. Payments are processed securely through Stripe. You may cancel your subscription at any time; access will be maintained until the end of the paid period. We do not offer refunds for partial periods, except where required by applicable law.' },
        {
          heading: '5. Acceptable use',
          body: 'You agree not to:',
          list: [
            'Use the service for illegal or unauthorized activities.',
            'Attempt to access restricted features without an active subscription.',
            'Share, resell or redistribute access to the platform.',
            'Interfere with the security or operation of the service.',
          ],
        },
        { heading: '6. Intellectual property', body: 'All Italianto content — including texts, designs, code, brand and logos — is owned by Italianto and protected by applicable intellectual property laws.' },
        { heading: '7. Limitation of liability', body: 'Italianto is provided "as is". We do not guarantee specific learning outcomes. We are not liable for indirect, incidental or consequential damages arising from the use of the service.' },
        { heading: '8. Modifications', body: 'We reserve the right to modify these terms at any time. Substantial changes will be notified by email. Continued use of the service after changes implies acceptance of the new terms.' },
        { heading: '9. Contact', body: 'For questions about these terms, contact us at italiantonline@gmail.com.' },
      ],
    },
    cookies: {
      title: 'Cookie Policy',
      what: { heading: 'What are cookies?', body: 'Cookies are small text files that websites store on your device when you visit them. They are used to remember your preferences and improve your browsing experience.' },
      types: {
        heading: 'Cookies we use',
        essential: { title: 'Essential cookies', body: 'Necessary for basic site operation. They include the authentication session cookie (Clerk) and language and theme preferences. They cannot be disabled.' },
        preferences: { title: 'Preference cookies', body: 'Store your language preferences (italianto-lang) and dark/light mode. They persist between sessions so you do not have to configure them each time.' },
      },
      no: { heading: 'What we do NOT do', list: ['We do not use advertising tracking cookies.', 'We do not share cookie data with third parties for commercial purposes.', 'We do not use social media cookies to track you outside the platform.'] },
      control: { heading: 'How to control cookies', body: 'You can control and delete cookies from your browser settings. Note that disabling essential cookies may affect platform functionality (for example, you will not be able to stay logged in).' },
      contact: { heading: 'Contact', body: 'For questions about our cookie policy, contact us at italiantonline@gmail.com.' },
    },
  },
} satisfies Record<Language, typeof legalTranslations.es>

export function useLegalT(lang: Language) {
  return legalTranslations[lang]
}
