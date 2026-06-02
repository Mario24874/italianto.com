import type { Metadata } from 'next'
import { GuiaClient } from './_guia-client'

export const metadata: Metadata = {
  title: 'Los 100 Verbos Más Usados en Italiano — Italianto',
  description: 'Guía completa de los 100 verbos italianos más comunes con significado en español e inglés, conjugación y ejemplos.',
}

export default function GuiaVerbosPage() {
  return <GuiaClient />
}
