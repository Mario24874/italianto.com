import { describe, it, expect } from 'vitest'
import { resolveSection } from './section-map'

describe('resolveSection', () => {
  it('mapea marketing home', () => {
    expect(resolveSection('/')).toEqual({ section: 'Home', area: 'marketing' })
  })
  it('mapea precios', () => {
    expect(resolveSection('/precios')).toEqual({ section: 'Precios', area: 'marketing' })
  })
  it('agrupa rutas de lanzamiento por prefijo', () => {
    expect(resolveSection('/lancio/guia-verbos')).toEqual({ section: 'Lanzamiento', area: 'marketing' })
  })
  it('mapea rutas del aula a area app', () => {
    expect(resolveSection('/lezioni/saluti')).toEqual({ section: 'Lecciones', area: 'app' })
  })
  it('devuelve Otras para rutas no mapeadas', () => {
    expect(resolveSection('/ruta-desconocida')).toEqual({ section: 'Otras', area: 'app' })
  })
})
