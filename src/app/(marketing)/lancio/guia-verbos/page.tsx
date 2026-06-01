import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PrintButton } from './_print-button'

export const metadata: Metadata = {
  title: 'Los 100 Verbos Más Usados en Italiano — Italianto',
  description: 'Guía completa de los 100 verbos italianos más comunes con significado, conjugación y ejemplos.',
}

interface Verb {
  n: number
  verb: string
  meaning: string
  example: string
  translation: string
}

const VERBS: Verb[] = [
  // Section 1 (1-10)
  { n: 1, verb: 'essere', meaning: 'ser / estar', example: 'Io sono italiano.', translation: 'Yo soy italiano.' },
  { n: 2, verb: 'avere', meaning: 'tener', example: 'Ho un cane.', translation: 'Tengo un perro.' },
  { n: 3, verb: 'fare', meaning: 'hacer', example: 'Faccio i compiti.', translation: 'Hago los deberes.' },
  { n: 4, verb: 'andare', meaning: 'ir', example: 'Vado a Roma.', translation: 'Voy a Roma.' },
  { n: 5, verb: 'dire', meaning: 'decir', example: 'Dico la verità.', translation: 'Digo la verdad.' },
  { n: 6, verb: 'potere', meaning: 'poder', example: 'Posso aiutarti?', translation: '¿Puedo ayudarte?' },
  { n: 7, verb: 'volere', meaning: 'querer', example: 'Voglio imparare.', translation: 'Quiero aprender.' },
  { n: 8, verb: 'sapere', meaning: 'saber', example: 'So parlare italiano.', translation: 'Sé hablar italiano.' },
  { n: 9, verb: 'venire', meaning: 'venir', example: 'Vengo domani.', translation: 'Vengo mañana.' },
  { n: 10, verb: 'stare', meaning: 'estar', example: 'Come stai?', translation: '¿Cómo estás?' },
  // Section 2 (11-20)
  { n: 11, verb: 'dare', meaning: 'dar', example: 'Do un libro.', translation: 'Doy un libro.' },
  { n: 12, verb: 'vedere', meaning: 'ver', example: 'Vedo il mare.', translation: 'Veo el mar.' },
  { n: 13, verb: 'dovere', meaning: 'deber / tener que', example: 'Devo studiare.', translation: 'Debo estudiar.' },
  { n: 14, verb: 'prendere', meaning: 'tomar / coger', example: 'Prendo il treno.', translation: 'Tomo el tren.' },
  { n: 15, verb: 'parlare', meaning: 'hablar', example: 'Parli italiano?', translation: '¿Hablas italiano?' },
  { n: 16, verb: 'capire', meaning: 'entender', example: 'Non capisco.', translation: 'No entiendo.' },
  { n: 17, verb: 'sentire', meaning: 'sentir / oír', example: 'Sento la musica.', translation: 'Oigo la música.' },
  { n: 18, verb: 'mettere', meaning: 'poner', example: 'Metto il libro qui.', translation: 'Pongo el libro aquí.' },
  { n: 19, verb: 'trovare', meaning: 'encontrar', example: 'Trovo le chiavi.', translation: 'Encuentro las llaves.' },
  { n: 20, verb: 'pensare', meaning: 'pensar', example: 'Penso a te.', translation: 'Pienso en ti.' },
  // Section 3 (21-30)
  { n: 21, verb: 'portare', meaning: 'llevar / traer', example: 'Porto un regalo.', translation: 'Traigo un regalo.' },
  { n: 22, verb: 'chiedere', meaning: 'pedir / preguntar', example: 'Chiedo informazioni.', translation: 'Pido información.' },
  { n: 23, verb: 'chiamare', meaning: 'llamar', example: 'Mi chiamo Marco.', translation: 'Me llamo Marco.' },
  { n: 24, verb: 'lasciare', meaning: 'dejar', example: 'Lascia un messaggio.', translation: 'Deja un mensaje.' },
  { n: 25, verb: 'passare', meaning: 'pasar', example: 'Passo dal mercato.', translation: 'Paso por el mercado.' },
  { n: 26, verb: 'tenere', meaning: 'tener / sostener', example: 'Tieni questo.', translation: 'Sostén esto.' },
  { n: 27, verb: 'tornare', meaning: 'volver', example: 'Torno a casa.', translation: 'Vuelvo a casa.' },
  { n: 28, verb: 'mangiare', meaning: 'comer', example: 'Mangio la pasta.', translation: 'Como la pasta.' },
  { n: 29, verb: 'vivere', meaning: 'vivir', example: 'Vivo a Milano.', translation: 'Vivo en Milán.' },
  { n: 30, verb: 'leggere', meaning: 'leer', example: 'Leggo un libro.', translation: 'Leo un libro.' },
  // Section 4 (31-40)
  { n: 31, verb: 'scrivere', meaning: 'escribir', example: 'Scrivo una lettera.', translation: 'Escribo una carta.' },
  { n: 32, verb: 'aprire', meaning: 'abrir', example: 'Apro la finestra.', translation: 'Abro la ventana.' },
  { n: 33, verb: 'chiudere', meaning: 'cerrar', example: 'Chiudo la porta.', translation: 'Cierro la puerta.' },
  { n: 34, verb: 'giocare', meaning: 'jugar', example: 'Gioco a calcio.', translation: 'Juego al fútbol.' },
  { n: 35, verb: 'lavorare', meaning: 'trabajar', example: 'Lavoro ogni giorno.', translation: 'Trabajo cada día.' },
  { n: 36, verb: 'studiare', meaning: 'estudiar', example: 'Studio italiano.', translation: 'Estudio italiano.' },
  { n: 37, verb: 'dormire', meaning: 'dormir', example: 'Dormo otto ore.', translation: 'Duermo ocho horas.' },
  { n: 38, verb: 'alzarsi', meaning: 'levantarse', example: 'Mi alzo presto.', translation: 'Me levanto temprano.' },
  { n: 39, verb: 'sedersi', meaning: 'sentarse', example: 'Siediti qui.', translation: 'Siéntate aquí.' },
  { n: 40, verb: 'aspettare', meaning: 'esperar', example: 'Aspetto l\'autobus.', translation: 'Espero el autobús.' },
  // Section 5 (41-50)
  { n: 41, verb: 'comprare', meaning: 'comprar', example: 'Compro il pane.', translation: 'Compro el pan.' },
  { n: 42, verb: 'vendere', meaning: 'vender', example: 'Vende la macchina.', translation: 'Vende el coche.' },
  { n: 43, verb: 'pagare', meaning: 'pagar', example: 'Pago con carta.', translation: 'Pago con tarjeta.' },
  { n: 44, verb: 'usare', meaning: 'usar', example: 'Uso il telefono.', translation: 'Uso el teléfono.' },
  { n: 45, verb: 'camminare', meaning: 'caminar', example: 'Cammino nel parco.', translation: 'Camino en el parque.' },
  { n: 46, verb: 'correre', meaning: 'correr', example: 'Corro ogni mattina.', translation: 'Corro cada mañana.' },
  { n: 47, verb: 'nuotare', meaning: 'nadar', example: 'Nuoto in piscina.', translation: 'Nado en la piscina.' },
  { n: 48, verb: 'viaggiare', meaning: 'viajar', example: 'Viaggio in treno.', translation: 'Viajo en tren.' },
  { n: 49, verb: 'arrivare', meaning: 'llegar', example: 'Arrivo alle otto.', translation: 'Llego a las ocho.' },
  { n: 50, verb: 'partire', meaning: 'partir / salir', example: 'Parto domani.', translation: 'Parto mañana.' },
  // Section 6 (51-60)
  { n: 51, verb: 'ricordare', meaning: 'recordar', example: 'Ricordo tutto.', translation: 'Recuerdo todo.' },
  { n: 52, verb: 'dimenticare', meaning: 'olvidar', example: 'Ho dimenticato.', translation: 'He olvidado.' },
  { n: 53, verb: 'aiutare', meaning: 'ayudar', example: 'Ti aiuto io.', translation: 'Yo te ayudo.' },
  { n: 54, verb: 'imparare', meaning: 'aprender', example: 'Imparo le parole.', translation: 'Aprendo las palabras.' },
  { n: 55, verb: 'insegnare', meaning: 'enseñar', example: 'Insegno matematica.', translation: 'Enseño matemáticas.' },
  { n: 56, verb: 'spiegare', meaning: 'explicar', example: 'Spiega la regola.', translation: 'Explica la regla.' },
  { n: 57, verb: 'rispondere', meaning: 'responder', example: 'Rispondo alla mail.', translation: 'Respondo al correo.' },
  { n: 58, verb: 'domandare', meaning: 'preguntar', example: 'Domando la strada.', translation: 'Pregunto por la calle.' },
  { n: 59, verb: 'incontrare', meaning: 'encontrar / conocer', example: 'Incontro gli amici.', translation: 'Me encuentro con amigos.' },
  { n: 60, verb: 'conoscere', meaning: 'conocer', example: 'Conosco Roma bene.', translation: 'Conozco Roma bien.' },
  // Section 7 (61-70)
  { n: 61, verb: 'amare', meaning: 'amar', example: 'Amo l\'Italia.', translation: 'Amo Italia.' },
  { n: 62, verb: 'odiare', meaning: 'odiar', example: 'Odio il traffico.', translation: 'Odio el tráfico.' },
  { n: 63, verb: 'piacere', meaning: 'gustar', example: 'Mi piace la pizza.', translation: 'Me gusta la pizza.' },
  { n: 64, verb: 'voler bene', meaning: 'querer (afecto)', example: 'Ti voglio bene.', translation: 'Te quiero.' },
  { n: 65, verb: 'ringraziare', meaning: 'agradecer', example: 'Ti ringrazio molto.', translation: 'Te agradezco mucho.' },
  { n: 66, verb: 'scusare', meaning: 'disculpar', example: 'Mi scusi.', translation: 'Disculpe.' },
  { n: 67, verb: 'salutare', meaning: 'saludar', example: 'Saluto i vicini.', translation: 'Saludo a los vecinos.' },
  { n: 68, verb: 'sperare', meaning: 'esperar (desear)', example: 'Spero di vinere.', translation: 'Espero venir.' },
  { n: 69, verb: 'credere', meaning: 'creer', example: 'Credo in me.', translation: 'Creo en mí.' },
  { n: 70, verb: 'sembrare', meaning: 'parecer', example: 'Sembra strano.', translation: 'Parece raro.' },
  // Section 8 (71-80)
  { n: 71, verb: 'mostrare', meaning: 'mostrar', example: 'Mostra la foto.', translation: 'Muestra la foto.' },
  { n: 72, verb: 'guardare', meaning: 'mirar', example: 'Guardo la TV.', translation: 'Miro la televisión.' },
  { n: 73, verb: 'ascoltare', meaning: 'escuchar', example: 'Ascolto musica.', translation: 'Escucho música.' },
  { n: 74, verb: 'cantare', meaning: 'cantar', example: 'Canto una canzone.', translation: 'Canto una canción.' },
  { n: 75, verb: 'ballare', meaning: 'bailar', example: 'Ballo con te.', translation: 'Bailo contigo.' },
  { n: 76, verb: 'ridere', meaning: 'reír', example: 'Rido molto.', translation: 'Me río mucho.' },
  { n: 77, verb: 'piangere', meaning: 'llorar', example: 'Piangi spesso?', translation: '¿Lloras seguido?' },
  { n: 78, verb: 'sorridere', meaning: 'sonreír', example: 'Sorrido sempre.', translation: 'Siempre sonrío.' },
  { n: 79, verb: 'toccare', meaning: 'tocar', example: 'Tocca il piano.', translation: 'Toca el piano.' },
  { n: 80, verb: 'cucinare', meaning: 'cocinar', example: 'Cucino la cena.', translation: 'Cocino la cena.' },
  // Section 9 (81-90)
  { n: 81, verb: 'costruire', meaning: 'construir', example: 'Costruisce una casa.', translation: 'Construye una casa.' },
  { n: 82, verb: 'rompere', meaning: 'romper', example: 'Ho rotto il vetro.', translation: 'He roto el vidrio.' },
  { n: 83, verb: 'sistemare', meaning: 'arreglar / ordenar', example: 'Sistema la stanza.', translation: 'Arregla la habitación.' },
  { n: 84, verb: 'cambiare', meaning: 'cambiar', example: 'Cambio idea.', translation: 'Cambio de idea.' },
  { n: 85, verb: 'crescere', meaning: 'crecer', example: 'Cresci in fretta.', translation: 'Creces rápido.' },
  { n: 86, verb: 'diventare', meaning: 'convertirse en', example: 'Divento medico.', translation: 'Me convierto en médico.' },
  { n: 87, verb: 'parere', meaning: 'parecer', example: 'Mi pare giusto.', translation: 'Me parece justo.' },
  { n: 88, verb: 'restare', meaning: 'quedarse', example: 'Resto a casa.', translation: 'Me quedo en casa.' },
  { n: 89, verb: 'rimanere', meaning: 'permanecer', example: 'Rimane qui.', translation: 'Permanece aquí.' },
  { n: 90, verb: 'permettere', meaning: 'permitir', example: 'Permetti di parlare.', translation: 'Permíteme hablar.' },
  // Section 10 (91-100)
  { n: 91, verb: 'uscire', meaning: 'salir', example: 'Esco alle 8.', translation: 'Salgo a las 8.' },
  { n: 92, verb: 'entrare', meaning: 'entrar', example: 'Entro in classe.', translation: 'Entro al aula.' },
  { n: 93, verb: 'salire', meaning: 'subir', example: 'Salgo le scale.', translation: 'Subo las escaleras.' },
  { n: 94, verb: 'scendere', meaning: 'bajar', example: 'Scendo dall\'autobus.', translation: 'Bajo del autobús.' },
  { n: 95, verb: 'cadere', meaning: 'caer', example: 'Sono caduto.', translation: 'Me he caído.' },
  { n: 96, verb: 'alzare', meaning: 'levantar', example: 'Alza la mano.', translation: 'Levanta la mano.' },
  { n: 97, verb: 'abbassare', meaning: 'bajar / reducir', example: 'Abbassa il volume.', translation: 'Baja el volumen.' },
  { n: 98, verb: 'iniziare', meaning: 'empezar', example: 'Iniziamo ora.', translation: 'Empecemos ahora.' },
  { n: 99, verb: 'finire', meaning: 'terminar', example: 'Finisco il lavoro.', translation: 'Termino el trabajo.' },
  { n: 100, verb: 'continuare', meaning: 'continuar', example: 'Continua a studiare.', translation: 'Sigue estudiando.' },
]

const SECTIONS = [
  { title: 'Verbos 1–10: Los Esenciales', range: [1, 10] },
  { title: 'Verbos 11–20: Acciones Cotidianas', range: [11, 20] },
  { title: 'Verbos 21–30: Movimiento y Vida', range: [21, 30] },
  { title: 'Verbos 31–40: Rutinas Diarias', range: [31, 40] },
  { title: 'Verbos 41–50: Actividades y Viajes', range: [41, 50] },
  { title: 'Verbos 51–60: Comunicación y Aprendizaje', range: [51, 60] },
  { title: 'Verbos 61–70: Emociones y Relaciones', range: [61, 70] },
  { title: 'Verbos 71–80: Sentidos y Expresión', range: [71, 80] },
  { title: 'Verbos 81–90: Cambios y Permanencia', range: [81, 90] },
  { title: 'Verbos 91–100: Movimiento Espacial', range: [91, 100] },
]

export default function GuiaVerbosPage() {
  return (
    <>
      <style>{`
        @media print {
          header, footer, nav, .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-bg { background: white !important; }
          table { border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 11px; }
          th { background: #f0f0f0; }
          h2, h3 { color: black !important; }
          .gradient-text { color: #1a7d3c !important; -webkit-text-fill-color: #1a7d3c !important; }
        }
      `}</style>

      <div className="py-16 px-4 sm:px-6 lg:px-8 min-h-screen print-bg">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Link href="/lancio" className="inline-flex items-center gap-2 text-sm text-verde-500 hover:text-verde-300 transition-colors mb-8 print:hidden">
              ← Volver a la página de lanzamiento
            </Link>
            <div className="flex justify-center mb-6">
              <Image
                src="/logo_Italianto.png"
                alt="Italianto"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-4 tracking-tight">
              Los{' '}
              <span className="gradient-text">100 Verbos</span>
              {' '}Más Usados en Italiano
            </h1>
            <p className="text-lg text-verde-400 max-w-2xl mx-auto mb-8">
              Infinitivo, significado, ejemplo en italiano y traducción al español. El recurso esencial para todo estudiante de italiano.
            </p>
            <div className="flex justify-center">
              <PrintButton />
            </div>
          </div>

          {/* Intro */}
          <div className="bg-verde-950/40 border border-verde-800/30 rounded-2xl p-6 mb-12 text-verde-400 text-sm leading-relaxed">
            <strong className="text-verde-200">¿Cómo usar esta guía?</strong> Estudia 10 verbos por día. Para cada verbo, practica la conjugación en presente con los pronombres <em>io, tu, lui/lei, noi, voi, loro</em>. Luego construye frases propias usando el ejemplo como modelo. En 10 días dominarás los 100 verbos fundamentales del italiano.
          </div>

          {/* Verb sections */}
          {SECTIONS.map(section => {
            const sectionVerbs = VERBS.filter(v => v.n >= section.range[0] && v.n <= section.range[1])
            return (
              <div key={section.title} className="mb-10">
                <h2 className="text-xl font-extrabold text-verde-100 mb-4 flex items-center gap-3">
                  <span className="text-verde-600 font-mono text-sm">{section.range[0]}–{section.range[1]}</span>
                  {section.title}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-verde-800/40">
                        <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-verde-600 w-10">N°</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-verde-600">Verbo</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-verde-600">Significado</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-verde-600">Ejemplo en italiano</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-verde-600">Traducción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionVerbs.map((v, i) => (
                        <tr
                          key={v.n}
                          className={`border-b border-verde-900/30 ${i % 2 === 0 ? 'bg-verde-950/20' : ''} hover:bg-verde-950/40 transition-colors`}
                        >
                          <td className="py-2.5 px-3 text-verde-600 text-xs font-mono">{v.n}</td>
                          <td className="py-2.5 px-3 font-bold text-verde-100 italic">{v.verb}</td>
                          <td className="py-2.5 px-3 text-verde-400">{v.meaning}</td>
                          <td className="py-2.5 px-3 text-verde-300 italic">{v.example}</td>
                          <td className="py-2.5 px-3 text-verde-500">{v.translation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}

          {/* Footer */}
          <div className="mt-12 py-8 border-t border-verde-800/30 text-center">
            <p className="text-sm text-verde-600">
              © 2026 Italianto — La plataforma para aprender italiano con IA.{' '}
              <Link href="/lancio" className="text-verde-400 hover:text-verde-200 transition-colors print:hidden">
                Volver a /lancio
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
