import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logApiUsage } from '@/lib/api-usage'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Lesson 1 canonical Spanish study guide (from Drive doc 1Op0vfLwBLGxZdIyXvO40MU4sBtWUB4FI).
// Used when no `guide` is passed in the body and the lesson id matches Lezione 1.
const LESSON1_ID = 'b9d1c131-8075-4cca-a31d-266df881367e'
const LESSON1_GUIDE = `OBJETIVOS DE LA LECCIÓN:
- Aprender el alfabeto italiano (21 letras + 5 extranjeras) y los sonidos especiales
- Los meses del año y los días de la semana en italiano
- Saludar en italiano formal e informal (TU / LEI) y presentarse
- Usar correctamente los artículos determinativos e indeterminativos
- Aprender los números del 1 al 1.000.000 y sus reglas de formación
- Conocer todos los colores en italiano con sus usos y concordancia
- Identificar sustantivos que terminan en -E (femeninos y masculinos)
- Conocer las excepciones al plural de los sustantivos

SECCIÓN 1 — L'Alfabeto Italiano
El alfabeto italiano está formado por 26 letras en total: 21 letras propias y 5 letras extranjeras incorporadas de otros idiomas.
Letras Italianas (21): A=a, B=bi, C=ci, D=di, E=e, F=effe, G=gi, H=acca, I=i, L=elle, M=emme, N=enne, O=o, P=pi, Q=qu, R=erre, S=esse, T=ti, U=u, V=vu, Z=zeta.
Letras Extranjeras (5): J=i lunga, K=cappa, W=vu doppia, X=ics, Y=ipsilon.
Consejo: Las letras J, K, W, X, Y se usan en palabras de origen extranjero: jeans, karate, web, taxi, yogurt.
Suoni Particolari — Pronunciación especial (Combinación | Suena como | Equivalente en español | Ejemplos):
CE–CI | CHE–CHI | c ante e/i → /k/ | cento, città
CIA–CIO–CIU | CHA–CHO–CHU | ch española | ciao, cioccolato
CHE–CHI | que/qui | que/qui español | amiche, chiave
GE–GI | suave (ye/yi) | ge/gi italiana | gelato, girasole
GHE–GHI | GÜE–GÜI | g fuerte ante e/i | spaghetti, lamborghini
GLI | LLI | ll española (España) | famiglia, moglie
GN | Ñ | ñ española | gnomo, montagna
SCE–SCI | SHE–SHI | sh inglesa | scegliere, cuscino
SCIA/SCIO/SCIU | SHA/SHO/SHU | sh inglesa | lasciare, asciugare
QUA/QUE/QUI/QUO | igual al español | qu española | quaderno, questo

SECCIÓN 2 — Mesi e Giorni
Nota: Los meses y días de la semana se escriben con letra MINÚSCULA en italiano (diferente al inglés).
I Mesi dell'Anno (Nº | Mes): 01 gennaio, 02 febbraio, 03 marzo, 04 aprile, 05 maggio, 06 giugno, 07 luglio, 08 agosto, 09 settembre, 10 ottobre, 11 novembre, 12 dicembre.
Consejo: Con los meses se usan 'a' o 'in'. Ante vocal se usa 'ad': Sono nato ad aprile. Siamo ad agosto.
I Giorni della Settimana (Lun a Dom): lunedì, martedì, mercoledì, giovedì, venerdì, sabato, domenica.

SECCIÓN 3 — I Saluti e le Presentazioni
En italiano existe una distinción fundamental: el TU (informal) y el LEI (formal). Saber cuándo usar cada uno es esencial.
Tabla (Situación | Al llegar | Al despedirse | Registro):
TU (informal) | Ciao! | Ciao / Arrivederci | Informal
LEI (formal) | Salve! | Arrivederci / ArrivederLa | Formal
Mañana (ambos) | Buongiorno | Buona giornata | Ambos
Tarde (ambos) | Buon pomeriggio | Buon pomeriggio | Ambos
Noche (ambos) | Buonasera | Buona serata / Buonanotte | Ambos
Hasta mañana (ambos) | — | A domani / A presto | Ambos
Diálogo informal: Lucia: Ciao Alberto! / Alberto: Ciao Lucia, come stai? / Lucia: Sto bene, grazie, e tu? / Alberto: Anch'io sto bene, grazie!
Diálogo formal: Sig.ra Rossi: Buongiorno signor Milano. / Sig. Milano: Come sta, signora? / Sig.ra Rossi: Bene, grazie, e Lei? / Sig. Milano: Così così, grazie.
Le Presentazioni (TU informal | LEI formal): Come ti chiami?/Come si chiama? · Di dove sei?/Di dov'è? · Dove abiti?/Dove abita? · Quanti anni hai?/Quanti anni ha? · Che fai nella vita?/Che fa nella vita?
Nota importante: Para la nacionalidad se dice 'Sono italiano/a' o 'Vengo dall'Italia'. No se dice 'Sono di + paese'.

SECCIÓN 4 — Gli Articoli
Los artículos concuerdan en género y número con el sustantivo. Hay artículos determinativos (el/la/los/las) e indeterminativos (un/una).
Articoli Determinativi (Tipo de palabra | Masc. Sing. | Masc. Plur. | Fem. Sing. | Fem. Plur. | Ejemplo Sing. | Ejemplo Plur.):
Consonante normal | il | i | la | le | il libro | i libri
z, ps, s+cons., gn, y, x | lo | gli | — | — | lo zaino | gli zaini
Vocal | l' | gli | l' | le | l'amico | gli amici
Consejo: La forma LO se usa antes de masculinos que empiezan por z, ps, s+consonante, gn, y, x.
Articoli Indeterminativi (Tipo | Masc. Sing. | Masc. Plur. | Fem. Sing. | Fem. Plur. | Ejemplo Sing. | Ejemplo Plur.):
Consonante normal | un | dei | una | delle | un libro | dei libri
z, ps, s+cons., gn, y, x | uno | degli | — | — | uno zaino | degli zaini
Vocal | un | degli | un' | delle | un amico | degli amici
Nota: Las formas plurales dei/degli/delle son artículos partitivos (equivalen a 'unos/unas').
Consejo: Aprende siempre la palabra nueva con su artículo: 'il libro' (no solo 'libro').

SECCIÓN 5 — I Numeri
Los números en italiano son fundamentales para hablar de cantidades, fechas, horas, precios y teléfonos.
Da 1 a 20: 1 uno, 2 due, 3 tre, 4 quattro, 5 cinque, 6 sei, 7 sette, 8 otto, 9 nove, 10 dieci, 11 undici, 12 dodici, 13 tredici, 14 quattordici, 15 quindici, 16 sedici, 17 diciassette, 18 diciotto, 19 diciannove, 20 venti.
Decenas: 20 venti, 21 ventuno, 22 ventidue, 23 ventitré, 30 trenta, 40 quaranta, 50 cinquanta, 60 sessanta, 70 settanta, 80 ottanta, 90 novanta, 100 cento.
Centenas/miles/millones: 100 cento, 200 duecento, 300 trecento, 400 quattrocento, 500 cinquecento, 600 seicento, 700 settecento, 800 ottocento, 900 novecento, 1.000 mille, 2.000 duemila, 3.000 tremila, 100.000 centomila, 1.000.000 un milione.
Reglas clave de formación:
- MILLE (1.000) en singular → MILA en plural: duemila, tremila, quattromila...
- CENTO (100) no cambia: duecento, trecento, quattrocento...
- Las decenas pierden la vocal ante -UNO y -OTTO: ventuno, trentotto, quarantuno...
- TRE sin acento (3), pero VENTITRÉ, TRENTATRÉ, etc. llevan acento.
- MILIONE (1.000.000) → MILIONI en plural: due milioni, tre milioni.
- Números de 2 cifras se escriben en una sola palabra: ventisei (26), quarantotto (48).

SECCIÓN 6 — I Colori
Los colores en italiano son adjetivos. Concuerdan en género y número con el sustantivo, excepto los colores invariables.
Tabla (Color | Masculino | Femenino | Plural m. | Plural f.):
ROSSO (rojo) | rosso | rossa | rossi | rosse
BLU (azul, invariable) | blu | blu | blu | blu
VERDE (verde) | verde | verde | verdi | verdi
GIALLO (amarillo) | giallo | gialla | gialli | gialle
NERO (negro) | nero | nera | neri | nere
BIANCO (blanco) | bianco | bianca | bianchi | bianche
GRIGIO (gris) | grigio | grigia | grigi | grigie
ROSA (rosa, invariable) | rosa | rosa | rosa | rosa
AZZURRO (celeste) | azzurro | azzurra | azzurri | azzurre
ARANCIONE (naranja, invariable) | arancione | arancione | arancioni | arancioni
VIOLA (violeta, invariable) | viola | viola | viola | viola
MARRONE (marrón, invariable) | marrone | marrone | marroni | marroni
FUCSIA (fucsia, invariable) | fucsia | fucsia | fucsia | fucsia
Nota importante: Colores invariables (no cambian nunca): BLU, ROSA, VIOLA, ARANCIONE, MARRONE, FUCSIA.
Ejemplos de concordancia: un gatto nero / una gatta nera; due gatti neri / due gatte nere; il cielo azzurro / la gonna azzurra.

SECCIÓN 7 — Parole che finiscono in -E
En italiano, los sustantivos que terminan en -E pueden ser femeninos o masculinos. No hay forma de saber el género solo por la terminación: hay que aprenderlos con el artículo.
Nota: Memoriza siempre el artículo: la canzone (no 'canzone'), il fiore (no 'fiore').
Femeninos (la/le): la canzone→le canzoni, la lezione→le lezioni, la chiave→le chiavi, la stazione→le stazioni, la notte→le notti, la moglie→le mogli, la carne→le carni, la pace→le paci, la nave→le navi, la classe→le classi.
Masculinos (il, lo/i, gli): il cane→i cani, lo studente→gli studenti, il fiore→i fiori, l'esame→gli esami, il mese→i mesi, il sole→i soli, il paese→i paesi, il colore→i colori, il mare→i mari, il ristorante→i ristoranti.
Nota: INSEGNANTE, CANTANTE, STUDENTE son de género ambiguo: il mio insegnante (hombre) / la mia insegnante (mujer).

SECCIÓN 8 — Eccezioni al Plurale
La mayoría de los sustantivos siguen reglas regulares (-o→-i, -a→-e, -e→-i). Pero hay grupos que se comportan distinto.
1. Invariables (no cambian en plural): la città→le città, il caffè→i caffè, il bar→i bar, lo sport→gli sport, il film→i film, la crisi→le crisi, la foto→le foto, la moto→le moto.
2. Masculinos en singular con plural femenino en -a: il braccio→le braccia, il dito→le dita, l'osso→le ossa, l'uovo→le uova, il ginocchio→le ginocchia, il labbro→le labbra, il paio→le paia.
3. Doble plural (dos formas con distinto significado): il braccio → i bracci (de sillón/candelabro) / le braccia (del cuerpo); il muro → i muri (de edificio) / le mura (murallas de ciudad); il corno → i corni (instrumentos) / le corna (cuernos de animal).
4. Excepciones ortográficas: -co/-ca → -chi/-che (il fuoco→i fuochi, la bocca→le bocche); -go/-ga → -ghi/-ghe (il lago→i laghi); -co átono → -ci (l'amico→gli amici, il medico→i medici); -cia/-gia sin vocal antes → -ce/-ge (la faccia→le facce); -cia/-gia con vocal antes → -cie/-gie (la camicia→le camicie).`

/**
 * Rebuild content_html in canonical Spanish by FORMATTING a Spanish source guide
 * (no translation — the guide is already Spanish, so there are zero translation
 * leaks). Claude only adds HTML structure. The Spanish guide text is passed in
 * the POST body as { guide: "<plain spanish guide text>" }.
 */
const SYSTEM = `Eres un maquetador HTML para una plataforma de italiano. Recibes el texto de una guía de estudio EN ESPAÑOL y lo conviertes en HTML rico para la lección. REGLAS ESTRICTAS:

1. NO traduzcas nada. El texto ya está en español; las palabras italianas de estudio (alfabeto, ejemplos, vocabulario) se quedan en italiano. Mantén el texto TAL CUAL, solo añades etiquetas HTML.
2. Empieza SIEMPRE con un bloque de introducción ANTES del primer <h2>: un <p> de contexto + <p><strong>Objetivos de la lección:</strong></p> + una <ul> con un <li> por objetivo (cada uno con su emoji).
3. Cada sección temática lleva <h2> con un emoji apropiado al inicio (ej: <h2>🔤 L'Alfabeto Italiano</h2>, <h2>🔊 Pronunciazione</h2>, <h2>📅 Mesi e Giorni</h2>, <h2>👋 I Saluti e le Presentazioni</h2>, <h2>📖 Gli Articoli</h2>, <h2>🔢 I Numeri</h2>, <h2>🎨 I Colori</h2>, <h2>📝 Parole in -E</h2>, <h2>⚠️ Eccezioni al Plurale</h2>). Conserva los títulos italianos de los temas.
4. Usa <table><thead><tr><th>…</th></tr></thead><tbody><tr><td>…</td></tr></tbody></table> para TODOS los datos tabulares (alfabeto, sonidos, meses, días, saludos, artículos, números, colores, plurales). Las CABECERAS de tabla van en ESPAÑOL (Letra, Nombre, Mes, Combinación, Equivalente, Ejemplos, Singular, Plural, Significado, etc.). Las celdas con palabras italianas se quedan en italiano.
5. Consejos (📌) → <blockquote class="tip">. Notas importantes (ℹ️) → <blockquote class="info">. Diálogos (💬) → <blockquote class="dialogo"> con <p><strong>Hablante:</strong> texto</p> por línea.
6. Para colores, si mencionas un color, puedes resaltarlo con <span style="color:#HEX;font-weight:600">nombre</span> (rosso=#dc2626, blu=#2563eb, verde=#16a34a, giallo=#ca8a04, nero=#1c1917, bianco con fondo, grigio=#6b7280, viola=#9333ea, arancione=#f97316, azzurro=#1d4ed8).
7. Usa <hr> entre secciones principales. Etiquetas permitidas: h2,h3,h4,p,strong,em,ul,ol,li,blockquote,table,thead,tbody,tr,th,td,hr,span.
8. Llama a la herramienta save_content con el HTML completo.`

const TOOL: Anthropic.Tool = {
  name: 'save_content',
  description: 'Guarda el content_html en español ya maquetado.',
  input_schema: {
    type: 'object' as const,
    properties: {
      content_html: { type: 'string', description: 'HTML completo de la lección en español, empezando por el bloque de introducción.' },
    },
    required: ['content_html'],
  },
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })

    const { id } = await params
    let guide = ''
    let clearTranslations = true
    try {
      const body = await req.json()
      guide = (body.guide as string) ?? ''
      if (body.clearTranslations === false) clearTranslations = false
    } catch { /* sin body */ }

    // Fall back to the embedded guide for known lessons
    if (!guide.trim() && id === LESSON1_ID) guide = LESSON1_GUIDE

    if (!guide.trim() || guide.length < 200) {
      return NextResponse.json({ error: 'Falta el texto de la guía (campo "guide") o es muy corto.' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 20000,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'save_content' },
      messages: [{ role: 'user', content: `Guía de estudio (español):\n\n${guide}` }],
    })
    void logApiUsage('claude-sonnet', 'rebuild-es', msg.usage.input_tokens, msg.usage.output_tokens)

    const tool = msg.content.find(b => b.type === 'tool_use')
    if (!tool || tool.type !== 'tool_use') {
      return NextResponse.json({ error: `Sin tool_use (stop: ${msg.stop_reason})` }, { status: 502 })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = tool.input as any
    if (!raw.content_html || raw.content_html.length < 200) {
      return NextResponse.json({ error: 'content_html generado vacío o muy corto.' }, { status: 502 })
    }

    const supabase = getSupabaseAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cur } = await supabase.from('lessons').select('translations').eq('id', id).single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translations = clearTranslations ? {} : ((cur as any)?.translations ?? {})

    const { error: updErr } = await supabase
      .from('lessons')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ content_html: raw.content_html, translations, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      length: raw.content_html.length,
      preview: raw.content_html.slice(0, 200),
      translations_cleared: clearTranslations,
    })
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err)
    console.error('[rebuild-es]', m)
    return NextResponse.json({ error: m }, { status: 500 })
  }
}
