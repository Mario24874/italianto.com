import { describe, it, expect } from 'vitest'
import { sanitizeCell, toCSV } from './csv'

describe('sanitizeCell', () => {
  it('prefija celdas peligrosas para evitar CSV injection', () => {
    expect(sanitizeCell('=SUM(A1)')).toBe("'=SUM(A1)")
    expect(sanitizeCell('+1')).toBe("'+1")
    expect(sanitizeCell('-1')).toBe("'-1")
    expect(sanitizeCell('@x')).toBe("'@x")
  })
  it('escapa comillas y comas', () => {
    expect(sanitizeCell('a,b')).toBe('"a,b"')
    expect(sanitizeCell('a"b')).toBe('"a""b"')
  })
  it('deja texto normal intacto', () => {
    expect(sanitizeCell('Lecciones')).toBe('Lecciones')
  })
})

describe('toCSV', () => {
  it('genera cabecera y filas', () => {
    const csv = toCSV(['sec', 'visitas'], [['Home', '3'], ['=mal', '1']])
    expect(csv.split('\n')[0]).toBe('sec,visitas')
    expect(csv).toContain("'=mal")
  })
})
