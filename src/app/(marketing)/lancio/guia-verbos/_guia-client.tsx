'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PrintButton } from './_print-button'

type Lang = 'es' | 'en'

interface Verb {
  n: number
  verb: string
  es_meaning: string
  en_meaning: string
  example: string
  es_translation: string
  en_translation: string
}

const VERBS: Verb[] = [
  // 1–10
  { n: 1,   verb: 'essere',      es_meaning: 'ser / estar',         en_meaning: 'to be',              example: 'Io sono italiano.',         es_translation: 'Yo soy italiano.',          en_translation: 'I am Italian.' },
  { n: 2,   verb: 'avere',       es_meaning: 'tener',               en_meaning: 'to have',             example: 'Ho un cane.',               es_translation: 'Tengo un perro.',           en_translation: 'I have a dog.' },
  { n: 3,   verb: 'fare',        es_meaning: 'hacer',               en_meaning: 'to do / make',        example: 'Faccio i compiti.',         es_translation: 'Hago los deberes.',         en_translation: 'I do my homework.' },
  { n: 4,   verb: 'andare',      es_meaning: 'ir',                  en_meaning: 'to go',               example: 'Vado a Roma.',              es_translation: 'Voy a Roma.',               en_translation: 'I go to Rome.' },
  { n: 5,   verb: 'dire',        es_meaning: 'decir',               en_meaning: 'to say / tell',       example: 'Dico la verità.',           es_translation: 'Digo la verdad.',           en_translation: 'I tell the truth.' },
  { n: 6,   verb: 'potere',      es_meaning: 'poder',               en_meaning: 'to be able to / can', example: 'Posso aiutarti?',           es_translation: '¿Puedo ayudarte?',          en_translation: 'Can I help you?' },
  { n: 7,   verb: 'volere',      es_meaning: 'querer',              en_meaning: 'to want',             example: 'Voglio imparare.',          es_translation: 'Quiero aprender.',          en_translation: 'I want to learn.' },
  { n: 8,   verb: 'sapere',      es_meaning: 'saber',               en_meaning: 'to know (how to)',    example: 'So parlare italiano.',      es_translation: 'Sé hablar italiano.',       en_translation: 'I know how to speak Italian.' },
  { n: 9,   verb: 'venire',      es_meaning: 'venir',               en_meaning: 'to come',             example: 'Vengo domani.',             es_translation: 'Vengo mañana.',             en_translation: 'I come tomorrow.' },
  { n: 10,  verb: 'stare',       es_meaning: 'estar',               en_meaning: 'to be / stay',        example: 'Come stai?',                es_translation: '¿Cómo estás?',              en_translation: 'How are you?' },
  // 11–20
  { n: 11,  verb: 'dare',        es_meaning: 'dar',                 en_meaning: 'to give',             example: 'Do un libro.',              es_translation: 'Doy un libro.',             en_translation: 'I give a book.' },
  { n: 12,  verb: 'vedere',      es_meaning: 'ver',                 en_meaning: 'to see',              example: 'Vedo il mare.',             es_translation: 'Veo el mar.',               en_translation: 'I see the sea.' },
  { n: 13,  verb: 'dovere',      es_meaning: 'deber / tener que',   en_meaning: 'to have to / must',   example: 'Devo studiare.',            es_translation: 'Debo estudiar.',            en_translation: 'I have to study.' },
  { n: 14,  verb: 'prendere',    es_meaning: 'tomar / coger',       en_meaning: 'to take',             example: 'Prendo il treno.',          es_translation: 'Tomo el tren.',             en_translation: 'I take the train.' },
  { n: 15,  verb: 'parlare',     es_meaning: 'hablar',              en_meaning: 'to speak',            example: 'Parli italiano?',           es_translation: '¿Hablas italiano?',         en_translation: 'Do you speak Italian?' },
  { n: 16,  verb: 'capire',      es_meaning: 'entender',            en_meaning: 'to understand',       example: 'Non capisco.',              es_translation: 'No entiendo.',              en_translation: 'I don\'t understand.' },
  { n: 17,  verb: 'sentire',     es_meaning: 'sentir / oír',        en_meaning: 'to feel / hear',      example: 'Sento la musica.',          es_translation: 'Oigo la música.',           en_translation: 'I hear the music.' },
  { n: 18,  verb: 'mettere',     es_meaning: 'poner',               en_meaning: 'to put',              example: 'Metto il libro qui.',       es_translation: 'Pongo el libro aquí.',      en_translation: 'I put the book here.' },
  { n: 19,  verb: 'trovare',     es_meaning: 'encontrar',           en_meaning: 'to find',             example: 'Trovo le chiavi.',          es_translation: 'Encuentro las llaves.',     en_translation: 'I find the keys.' },
  { n: 20,  verb: 'pensare',     es_meaning: 'pensar',              en_meaning: 'to think',            example: 'Penso a te.',               es_translation: 'Pienso en ti.',             en_translation: 'I think of you.' },
  // 21–30
  { n: 21,  verb: 'portare',     es_meaning: 'llevar / traer',      en_meaning: 'to carry / bring',    example: 'Porto un regalo.',          es_translation: 'Traigo un regalo.',         en_translation: 'I bring a gift.' },
  { n: 22,  verb: 'chiedere',    es_meaning: 'pedir / preguntar',   en_meaning: 'to ask',              example: 'Chiedo informazioni.',      es_translation: 'Pido información.',         en_translation: 'I ask for information.' },
  { n: 23,  verb: 'chiamare',    es_meaning: 'llamar',              en_meaning: 'to call',             example: 'Mi chiamo Marco.',          es_translation: 'Me llamo Marco.',           en_translation: 'My name is Marco.' },
  { n: 24,  verb: 'lasciare',    es_meaning: 'dejar',               en_meaning: 'to leave / let',      example: 'Lascia un messaggio.',      es_translation: 'Deja un mensaje.',          en_translation: 'Leave a message.' },
  { n: 25,  verb: 'passare',     es_meaning: 'pasar',               en_meaning: 'to pass / go by',     example: 'Passo dal mercato.',        es_translation: 'Paso por el mercado.',      en_translation: 'I pass by the market.' },
  { n: 26,  verb: 'tenere',      es_meaning: 'tener / sostener',    en_meaning: 'to hold / keep',      example: 'Tieni questo.',             es_translation: 'Sostén esto.',              en_translation: 'Hold this.' },
  { n: 27,  verb: 'tornare',     es_meaning: 'volver',              en_meaning: 'to return',           example: 'Torno a casa.',             es_translation: 'Vuelvo a casa.',            en_translation: 'I return home.' },
  { n: 28,  verb: 'mangiare',    es_meaning: 'comer',               en_meaning: 'to eat',              example: 'Mangio la pasta.',          es_translation: 'Como la pasta.',            en_translation: 'I eat pasta.' },
  { n: 29,  verb: 'vivere',      es_meaning: 'vivir',               en_meaning: 'to live',             example: 'Vivo a Milano.',            es_translation: 'Vivo en Milán.',            en_translation: 'I live in Milan.' },
  { n: 30,  verb: 'leggere',     es_meaning: 'leer',                en_meaning: 'to read',             example: 'Leggo un libro.',           es_translation: 'Leo un libro.',             en_translation: 'I read a book.' },
  // 31–40
  { n: 31,  verb: 'scrivere',    es_meaning: 'escribir',            en_meaning: 'to write',            example: 'Scrivo una lettera.',       es_translation: 'Escribo una carta.',        en_translation: 'I write a letter.' },
  { n: 32,  verb: 'aprire',      es_meaning: 'abrir',               en_meaning: 'to open',             example: 'Apro la finestra.',         es_translation: 'Abro la ventana.',          en_translation: 'I open the window.' },
  { n: 33,  verb: 'chiudere',    es_meaning: 'cerrar',              en_meaning: 'to close',            example: 'Chiudo la porta.',          es_translation: 'Cierro la puerta.',         en_translation: 'I close the door.' },
  { n: 34,  verb: 'giocare',     es_meaning: 'jugar',               en_meaning: 'to play',             example: 'Gioco a calcio.',           es_translation: 'Juego al fútbol.',          en_translation: 'I play soccer.' },
  { n: 35,  verb: 'lavorare',    es_meaning: 'trabajar',            en_meaning: 'to work',             example: 'Lavoro ogni giorno.',       es_translation: 'Trabajo cada día.',         en_translation: 'I work every day.' },
  { n: 36,  verb: 'studiare',    es_meaning: 'estudiar',            en_meaning: 'to study',            example: 'Studio italiano.',          es_translation: 'Estudio italiano.',         en_translation: 'I study Italian.' },
  { n: 37,  verb: 'dormire',     es_meaning: 'dormir',              en_meaning: 'to sleep',            example: 'Dormo otto ore.',           es_translation: 'Duermo ocho horas.',        en_translation: 'I sleep eight hours.' },
  { n: 38,  verb: 'alzarsi',     es_meaning: 'levantarse',          en_meaning: 'to get up',           example: 'Mi alzo presto.',           es_translation: 'Me levanto temprano.',      en_translation: 'I wake up early.' },
  { n: 39,  verb: 'sedersi',     es_meaning: 'sentarse',            en_meaning: 'to sit down',         example: 'Siediti qui.',              es_translation: 'Siéntate aquí.',            en_translation: 'Sit here.' },
  { n: 40,  verb: 'aspettare',   es_meaning: 'esperar',             en_meaning: 'to wait',             example: 'Aspetto l\'autobus.',       es_translation: 'Espero el autobús.',        en_translation: 'I wait for the bus.' },
  // 41–50
  { n: 41,  verb: 'comprare',    es_meaning: 'comprar',             en_meaning: 'to buy',              example: 'Compro il pane.',           es_translation: 'Compro el pan.',            en_translation: 'I buy bread.' },
  { n: 42,  verb: 'vendere',     es_meaning: 'vender',              en_meaning: 'to sell',             example: 'Vende la macchina.',        es_translation: 'Vende el coche.',           en_translation: 'He sells the car.' },
  { n: 43,  verb: 'pagare',      es_meaning: 'pagar',               en_meaning: 'to pay',              example: 'Pago con carta.',           es_translation: 'Pago con tarjeta.',         en_translation: 'I pay by card.' },
  { n: 44,  verb: 'usare',       es_meaning: 'usar',                en_meaning: 'to use',              example: 'Uso il telefono.',          es_translation: 'Uso el teléfono.',          en_translation: 'I use the phone.' },
  { n: 45,  verb: 'camminare',   es_meaning: 'caminar',             en_meaning: 'to walk',             example: 'Cammino nel parco.',        es_translation: 'Camino en el parque.',      en_translation: 'I walk in the park.' },
  { n: 46,  verb: 'correre',     es_meaning: 'correr',              en_meaning: 'to run',              example: 'Corro ogni mattina.',       es_translation: 'Corro cada mañana.',        en_translation: 'I run every morning.' },
  { n: 47,  verb: 'nuotare',     es_meaning: 'nadar',               en_meaning: 'to swim',             example: 'Nuoto in piscina.',         es_translation: 'Nado en la piscina.',       en_translation: 'I swim in the pool.' },
  { n: 48,  verb: 'viaggiare',   es_meaning: 'viajar',              en_meaning: 'to travel',           example: 'Viaggio in treno.',         es_translation: 'Viajo en tren.',            en_translation: 'I travel by train.' },
  { n: 49,  verb: 'arrivare',    es_meaning: 'llegar',              en_meaning: 'to arrive',           example: 'Arrivo alle otto.',         es_translation: 'Llego a las ocho.',         en_translation: 'I arrive at eight.' },
  { n: 50,  verb: 'partire',     es_meaning: 'partir / salir',      en_meaning: 'to leave / depart',   example: 'Parto domani.',             es_translation: 'Parto mañana.',             en_translation: 'I leave tomorrow.' },
  // 51–60
  { n: 51,  verb: 'ricordare',   es_meaning: 'recordar',            en_meaning: 'to remember',         example: 'Ricordo tutto.',            es_translation: 'Recuerdo todo.',            en_translation: 'I remember everything.' },
  { n: 52,  verb: 'dimenticare', es_meaning: 'olvidar',             en_meaning: 'to forget',           example: 'Ho dimenticato.',           es_translation: 'He olvidado.',              en_translation: 'I forgot.' },
  { n: 53,  verb: 'aiutare',     es_meaning: 'ayudar',              en_meaning: 'to help',             example: 'Ti aiuto io.',              es_translation: 'Yo te ayudo.',              en_translation: 'I\'ll help you.' },
  { n: 54,  verb: 'imparare',    es_meaning: 'aprender',            en_meaning: 'to learn',            example: 'Imparo le parole.',         es_translation: 'Aprendo las palabras.',     en_translation: 'I learn the words.' },
  { n: 55,  verb: 'insegnare',   es_meaning: 'enseñar',             en_meaning: 'to teach',            example: 'Insegno matematica.',       es_translation: 'Enseño matemáticas.',       en_translation: 'I teach math.' },
  { n: 56,  verb: 'spiegare',    es_meaning: 'explicar',            en_meaning: 'to explain',          example: 'Spiega la regola.',         es_translation: 'Explica la regla.',         en_translation: 'Explain the rule.' },
  { n: 57,  verb: 'rispondere',  es_meaning: 'responder',           en_meaning: 'to answer',           example: 'Rispondo alla mail.',       es_translation: 'Respondo al correo.',       en_translation: 'I reply to the email.' },
  { n: 58,  verb: 'domandare',   es_meaning: 'preguntar',           en_meaning: 'to ask',              example: 'Domando la strada.',        es_translation: 'Pregunto por la calle.',    en_translation: 'I ask for directions.' },
  { n: 59,  verb: 'incontrare',  es_meaning: 'encontrar / conocer', en_meaning: 'to meet',             example: 'Incontro gli amici.',       es_translation: 'Me encuentro con amigos.',  en_translation: 'I meet my friends.' },
  { n: 60,  verb: 'conoscere',   es_meaning: 'conocer',             en_meaning: 'to know (someone)',   example: 'Conosco Roma bene.',        es_translation: 'Conozco Roma bien.',        en_translation: 'I know Rome well.' },
  // 61–70
  { n: 61,  verb: 'amare',       es_meaning: 'amar',                en_meaning: 'to love',             example: 'Amo l\'Italia.',            es_translation: 'Amo Italia.',               en_translation: 'I love Italy.' },
  { n: 62,  verb: 'odiare',      es_meaning: 'odiar',               en_meaning: 'to hate',             example: 'Odio il traffico.',         es_translation: 'Odio el tráfico.',          en_translation: 'I hate traffic.' },
  { n: 63,  verb: 'piacere',     es_meaning: 'gustar',              en_meaning: 'to like / please',    example: 'Mi piace la pizza.',        es_translation: 'Me gusta la pizza.',        en_translation: 'I like pizza.' },
  { n: 64,  verb: 'voler bene',  es_meaning: 'querer (afecto)',      en_meaning: 'to care for / love',  example: 'Ti voglio bene.',           es_translation: 'Te quiero.',                en_translation: 'I love you (care for you).' },
  { n: 65,  verb: 'ringraziare', es_meaning: 'agradecer',           en_meaning: 'to thank',            example: 'Ti ringrazio molto.',       es_translation: 'Te agradezco mucho.',       en_translation: 'I thank you very much.' },
  { n: 66,  verb: 'scusare',     es_meaning: 'disculpar',           en_meaning: 'to excuse / apologize',example: 'Mi scusi.',               es_translation: 'Disculpe.',                 en_translation: 'Excuse me.' },
  { n: 67,  verb: 'salutare',    es_meaning: 'saludar',             en_meaning: 'to greet',            example: 'Saluto i vicini.',          es_translation: 'Saludo a los vecinos.',     en_translation: 'I greet the neighbors.' },
  { n: 68,  verb: 'sperare',     es_meaning: 'esperar (desear)',     en_meaning: 'to hope',             example: 'Spero di venire.',          es_translation: 'Espero venir.',             en_translation: 'I hope to come.' },
  { n: 69,  verb: 'credere',     es_meaning: 'creer',               en_meaning: 'to believe',          example: 'Credo in me.',              es_translation: 'Creo en mí.',               en_translation: 'I believe in myself.' },
  { n: 70,  verb: 'sembrare',    es_meaning: 'parecer',             en_meaning: 'to seem',             example: 'Sembra strano.',            es_translation: 'Parece raro.',              en_translation: 'It seems strange.' },
  // 71–80
  { n: 71,  verb: 'mostrare',    es_meaning: 'mostrar',             en_meaning: 'to show',             example: 'Mostra la foto.',           es_translation: 'Muestra la foto.',          en_translation: 'Show the photo.' },
  { n: 72,  verb: 'guardare',    es_meaning: 'mirar',               en_meaning: 'to watch / look at',  example: 'Guardo la TV.',             es_translation: 'Miro la televisión.',       en_translation: 'I watch TV.' },
  { n: 73,  verb: 'ascoltare',   es_meaning: 'escuchar',            en_meaning: 'to listen',           example: 'Ascolto musica.',           es_translation: 'Escucho música.',           en_translation: 'I listen to music.' },
  { n: 74,  verb: 'cantare',     es_meaning: 'cantar',              en_meaning: 'to sing',             example: 'Canto una canzone.',        es_translation: 'Canto una canción.',        en_translation: 'I sing a song.' },
  { n: 75,  verb: 'ballare',     es_meaning: 'bailar',              en_meaning: 'to dance',            example: 'Ballo con te.',             es_translation: 'Bailo contigo.',            en_translation: 'I dance with you.' },
  { n: 76,  verb: 'ridere',      es_meaning: 'reír',                en_meaning: 'to laugh',            example: 'Rido molto.',               es_translation: 'Me río mucho.',             en_translation: 'I laugh a lot.' },
  { n: 77,  verb: 'piangere',    es_meaning: 'llorar',              en_meaning: 'to cry',              example: 'Piangi spesso?',            es_translation: '¿Lloras seguido?',          en_translation: 'Do you cry often?' },
  { n: 78,  verb: 'sorridere',   es_meaning: 'sonreír',             en_meaning: 'to smile',            example: 'Sorrido sempre.',           es_translation: 'Siempre sonrío.',           en_translation: 'I always smile.' },
  { n: 79,  verb: 'toccare',     es_meaning: 'tocar',               en_meaning: 'to touch',            example: 'Tocca il piano.',           es_translation: 'Toca el piano.',            en_translation: 'He plays the piano.' },
  { n: 80,  verb: 'cucinare',    es_meaning: 'cocinar',             en_meaning: 'to cook',             example: 'Cucino la cena.',           es_translation: 'Cocino la cena.',           en_translation: 'I cook dinner.' },
  // 81–90
  { n: 81,  verb: 'costruire',   es_meaning: 'construir',           en_meaning: 'to build',            example: 'Costruisce una casa.',      es_translation: 'Construye una casa.',       en_translation: 'He builds a house.' },
  { n: 82,  verb: 'rompere',     es_meaning: 'romper',              en_meaning: 'to break',            example: 'Ho rotto il vetro.',        es_translation: 'He roto el vidrio.',        en_translation: 'I broke the glass.' },
  { n: 83,  verb: 'sistemare',   es_meaning: 'arreglar / ordenar',  en_meaning: 'to fix / tidy',       example: 'Sistema la stanza.',        es_translation: 'Arregla la habitación.',    en_translation: 'He tidies the room.' },
  { n: 84,  verb: 'cambiare',    es_meaning: 'cambiar',             en_meaning: 'to change',           example: 'Cambio idea.',              es_translation: 'Cambio de idea.',           en_translation: 'I change my mind.' },
  { n: 85,  verb: 'crescere',    es_meaning: 'crecer',              en_meaning: 'to grow',             example: 'Cresci in fretta.',         es_translation: 'Creces rápido.',            en_translation: 'You grow fast.' },
  { n: 86,  verb: 'diventare',   es_meaning: 'convertirse en',      en_meaning: 'to become',           example: 'Divento medico.',           es_translation: 'Me convierto en médico.',   en_translation: 'I become a doctor.' },
  { n: 87,  verb: 'parere',      es_meaning: 'parecer',             en_meaning: 'to seem / appear',    example: 'Mi pare giusto.',           es_translation: 'Me parece justo.',          en_translation: 'It seems right to me.' },
  { n: 88,  verb: 'restare',     es_meaning: 'quedarse',            en_meaning: 'to stay',             example: 'Resto a casa.',             es_translation: 'Me quedo en casa.',         en_translation: 'I stay at home.' },
  { n: 89,  verb: 'rimanere',    es_meaning: 'permanecer',          en_meaning: 'to remain',           example: 'Rimane qui.',               es_translation: 'Permanece aquí.',           en_translation: 'He remains here.' },
  { n: 90,  verb: 'permettere',  es_meaning: 'permitir',            en_meaning: 'to allow / permit',   example: 'Permetti di parlare.',      es_translation: 'Permíteme hablar.',         en_translation: 'Let me speak.' },
  // 91–100
  { n: 91,  verb: 'uscire',      es_meaning: 'salir',               en_meaning: 'to go out',           example: 'Esco alle 8.',              es_translation: 'Salgo a las 8.',            en_translation: 'I go out at 8.' },
  { n: 92,  verb: 'entrare',     es_meaning: 'entrar',              en_meaning: 'to enter',            example: 'Entro in classe.',          es_translation: 'Entro al aula.',            en_translation: 'I enter the classroom.' },
  { n: 93,  verb: 'salire',      es_meaning: 'subir',               en_meaning: 'to go up / climb',    example: 'Salgo le scale.',           es_translation: 'Subo las escaleras.',       en_translation: 'I climb the stairs.' },
  { n: 94,  verb: 'scendere',    es_meaning: 'bajar',               en_meaning: 'to go down',          example: 'Scendo dall\'autobus.',     es_translation: 'Bajo del autobús.',         en_translation: 'I get off the bus.' },
  { n: 95,  verb: 'cadere',      es_meaning: 'caer',                en_meaning: 'to fall',             example: 'Sono caduto.',              es_translation: 'Me he caído.',              en_translation: 'I fell.' },
  { n: 96,  verb: 'alzare',      es_meaning: 'levantar',            en_meaning: 'to raise / lift',     example: 'Alza la mano.',             es_translation: 'Levanta la mano.',          en_translation: 'Raise your hand.' },
  { n: 97,  verb: 'abbassare',   es_meaning: 'bajar / reducir',     en_meaning: 'to lower / reduce',   example: 'Abbassa il volume.',        es_translation: 'Baja el volumen.',          en_translation: 'Lower the volume.' },
  { n: 98,  verb: 'iniziare',    es_meaning: 'empezar',             en_meaning: 'to start / begin',    example: 'Iniziamo ora.',             es_translation: 'Empecemos ahora.',          en_translation: 'Let\'s start now.' },
  { n: 99,  verb: 'finire',      es_meaning: 'terminar',            en_meaning: 'to finish',           example: 'Finisco il lavoro.',        es_translation: 'Termino el trabajo.',       en_translation: 'I finish work.' },
  { n: 100, verb: 'continuare',  es_meaning: 'continuar',           en_meaning: 'to continue',         example: 'Continua a studiare.',      es_translation: 'Sigue estudiando.',         en_translation: 'Keep studying.' },
]

const SECTIONS = {
  es: [
    { title: 'Verbos 1–10: Los Esenciales',                range: [1, 10] },
    { title: 'Verbos 11–20: Acciones Cotidianas',          range: [11, 20] },
    { title: 'Verbos 21–30: Movimiento y Vida',            range: [21, 30] },
    { title: 'Verbos 31–40: Rutinas Diarias',              range: [31, 40] },
    { title: 'Verbos 41–50: Actividades y Viajes',         range: [41, 50] },
    { title: 'Verbos 51–60: Comunicación y Aprendizaje',   range: [51, 60] },
    { title: 'Verbos 61–70: Emociones y Relaciones',       range: [61, 70] },
    { title: 'Verbos 71–80: Sentidos y Expresión',         range: [71, 80] },
    { title: 'Verbos 81–90: Cambios y Permanencia',        range: [81, 90] },
    { title: 'Verbos 91–100: Movimiento Espacial',         range: [91, 100] },
  ],
  en: [
    { title: 'Verbs 1–10: The Essentials',                 range: [1, 10] },
    { title: 'Verbs 11–20: Everyday Actions',              range: [11, 20] },
    { title: 'Verbs 21–30: Movement & Life',               range: [21, 30] },
    { title: 'Verbs 31–40: Daily Routines',                range: [31, 40] },
    { title: 'Verbs 41–50: Activities & Travel',           range: [41, 50] },
    { title: 'Verbs 51–60: Communication & Learning',      range: [51, 60] },
    { title: 'Verbs 61–70: Emotions & Relationships',      range: [61, 70] },
    { title: 'Verbs 71–80: Senses & Expression',           range: [71, 80] },
    { title: 'Verbs 81–90: Change & Permanence',           range: [81, 90] },
    { title: 'Verbs 91–100: Spatial Movement',             range: [91, 100] },
  ],
}

const UI = {
  es: {
    back: '← Volver a la página de lanzamiento',
    title: 'Los ',
    titleHighlight: '100 Verbos',
    titleSuffix: ' Más Usados en Italiano',
    subtitle: 'Infinitivo, significado, ejemplo en italiano y traducción. El recurso esencial para todo estudiante de italiano.',
    intro: '¿Cómo usar esta guía?',
    introBody: 'Estudia 10 verbos por día. Para cada verbo, practica la conjugación en presente con los pronombres <em>io, tu, lui/lei, noi, voi, loro</em>. Luego construye frases propias usando el ejemplo como modelo. En 10 días dominarás los 100 verbos fundamentales del italiano.',
    colN: 'N°',
    colVerb: 'Verbo',
    colMeaning: 'Significado',
    colExample: 'Ejemplo en italiano',
    colTranslation: 'Traducción',
    footer: '© 2026 Italianto — La plataforma para aprender italiano con IA.',
    backLink: 'Volver a /lancio',
  },
  en: {
    back: '← Back to launch page',
    title: 'The ',
    titleHighlight: '100 Verbs',
    titleSuffix: ' Most Used in Italian',
    subtitle: 'Infinitive, meaning, Italian example and translation. The essential resource for every Italian student.',
    intro: 'How to use this guide:',
    introBody: 'Study 10 verbs per day. For each verb, practice the conjugation in the present tense with the pronouns <em>io, tu, lui/lei, noi, voi, loro</em>. Then build your own sentences using the example as a model. In 10 days you will master the 100 fundamental verbs of Italian.',
    colN: 'No.',
    colVerb: 'Verb',
    colMeaning: 'Meaning',
    colExample: 'Italian example',
    colTranslation: 'Translation',
    footer: '© 2026 Italianto — The platform to learn Italian with AI.',
    backLink: 'Back to /lancio',
  },
}

export function GuiaClient() {
  const [lang, setLang] = useState<Lang>('es')
  const u = UI[lang]
  const sections = SECTIONS[lang]

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
              {u.back}
            </Link>
            <div className="flex justify-center mb-6">
              <Image src="/logo_Italianto.png" alt="Italianto" width={120} height={40} className="object-contain" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-verde-50 mb-4 tracking-tight">
              {u.title}<span className="gradient-text">{u.titleHighlight}</span>{u.titleSuffix}
            </h1>
            <p className="text-lg text-verde-400 max-w-2xl mx-auto mb-8">
              {u.subtitle}
            </p>

            {/* Language toggle */}
            <div className="flex items-center justify-center gap-3 mb-8 print:hidden">
              <span className="text-xs text-verde-600 uppercase tracking-wider">Traduzione</span>
              <div className="flex rounded-xl border border-verde-800/40 overflow-hidden">
                <button
                  onClick={() => setLang('es')}
                  className={`px-5 py-2 text-sm font-semibold transition-all ${lang === 'es' ? 'bg-verde-800/60 text-verde-100' : 'text-verde-500 hover:text-verde-300'}`}
                >
                  🇪🇸 Español
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-5 py-2 text-sm font-semibold transition-all border-l border-verde-800/40 ${lang === 'en' ? 'bg-verde-800/60 text-verde-100' : 'text-verde-500 hover:text-verde-300'}`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <PrintButton />
            </div>
          </div>

          {/* Intro */}
          <div className="bg-verde-950/40 border border-verde-800/30 rounded-2xl p-6 mb-12 text-verde-400 text-sm leading-relaxed">
            <strong className="text-verde-200">{u.intro}</strong>{' '}
            <span dangerouslySetInnerHTML={{ __html: u.introBody }} />
          </div>

          {/* Verb sections */}
          {sections.map(section => {
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
                        <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-verde-600 w-10">{u.colN}</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-verde-600">{u.colVerb}</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-verde-600">{u.colMeaning}</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-verde-600">{u.colExample}</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-verde-600">{u.colTranslation}</th>
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
                          <td className="py-2.5 px-3 text-verde-400">{lang === 'es' ? v.es_meaning : v.en_meaning}</td>
                          <td className="py-2.5 px-3 text-verde-300 italic">{v.example}</td>
                          <td className="py-2.5 px-3 text-verde-500">{lang === 'es' ? v.es_translation : v.en_translation}</td>
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
              {u.footer}{' '}
              <Link href="/lancio" className="text-verde-400 hover:text-verde-200 transition-colors print:hidden">
                {u.backLink}
              </Link>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
