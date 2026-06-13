import { describe, it, expect } from 'vitest'
import { aggregateBySection, aggregateUsers, type PageViewRow } from './queries'

const rows: PageViewRow[] = [
  { id: '1', user_id: 'u1', anon_id: 'a1', service: 'app', path: '/lezioni/x', section: 'Lecciones', entered_at: '2026-06-10T10:00:00Z', duration_seconds: 60 },
  { id: '2', user_id: 'u1', anon_id: 'a1', service: 'app', path: '/precios', section: 'Precios', entered_at: '2026-06-10T10:05:00Z', duration_seconds: 30 },
  { id: '3', user_id: null, anon_id: 'a2', service: 'marketing', path: '/', section: 'Home', entered_at: '2026-06-10T11:00:00Z', duration_seconds: null },
]

describe('aggregateBySection', () => {
  it('suma visitas y tiempo por sección', () => {
    const out = aggregateBySection(rows)
    const lecc = out.find(s => s.section === 'Lecciones')!
    expect(lecc.visits).toBe(1)
    expect(lecc.totalSeconds).toBe(60)
    expect(out[0].visits).toBeGreaterThanOrEqual(out[out.length - 1].visits)
  })
  it('cuenta visitas totales', () => {
    const out = aggregateBySection(rows)
    expect(out.reduce((s, r) => s + r.visits, 0)).toBe(3)
  })
})

describe('aggregateUsers', () => {
  it('agrupa solo usuarios logueados', () => {
    const out = aggregateUsers(rows)
    expect(out).toHaveLength(1)
    expect(out[0].userId).toBe('u1')
    expect(out[0].pages).toBe(2)
    expect(out[0].totalSeconds).toBe(90)
  })
})
