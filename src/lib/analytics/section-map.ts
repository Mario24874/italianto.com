export type Area = 'marketing' | 'app' | 'studio'
export interface SectionInfo { section: string; area: Area }

// Reglas ordenadas: la primera cuyo `test` coincida gana.
// `prefix` coincide con igualdad exacta o como prefijo seguido de '/'.
interface Rule { prefix: string; section: string; area: Area }

const RULES: Rule[] = [
  // Marketing
  { prefix: '/', section: 'Home', area: 'marketing' },
  { prefix: '/precios', section: 'Precios', area: 'marketing' },
  { prefix: '/lancio', section: 'Lanzamiento', area: 'marketing' },
  { prefix: '/contacto', section: 'Contacto', area: 'marketing' },
  { prefix: '/cookies', section: 'Cookies', area: 'marketing' },
  { prefix: '/sobre-nosotros', section: 'Sobre nosotros', area: 'marketing' },
  // Aula (grupo dashboard de este despliegue)
  { prefix: '/dashboard', section: 'Inicio', area: 'app' },
  { prefix: '/lezioni', section: 'Lecciones', area: 'app' },
  { prefix: '/corsi', section: 'Cursos', area: 'app' },
  { prefix: '/canzoni', section: 'Canciones', area: 'app' },
  { prefix: '/tutor', section: 'Tutor', area: 'app' },
  { prefix: '/passatempi', section: 'Pasatiempos', area: 'app' },
  { prefix: '/orario', section: 'Horario', area: 'app' },
  { prefix: '/informazioni', section: 'Información', area: 'app' },
  { prefix: '/downloads', section: 'Descargas', area: 'app' },
  { prefix: '/impostazioni', section: 'Ajustes', area: 'app' },
]

function matches(path: string, prefix: string): boolean {
  if (prefix === '/') return path === '/'
  return path === prefix || path.startsWith(prefix + '/')
}

export function resolveSection(path: string): SectionInfo {
  const clean = path.split('?')[0].replace(/\/+$/, '') || '/'
  for (const r of RULES) {
    if (matches(clean, r.prefix)) return { section: r.section, area: r.area }
  }
  return { section: 'Otras', area: 'app' }
}
