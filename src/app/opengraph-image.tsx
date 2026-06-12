import { ImageResponse } from 'next/og'

export const alt = 'Italianto — Aprende italiano con Inteligencia Artificial'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// og:image global del sitio (1200x630). Diseño solo con texto y colores de marca
// para no depender de assets externos en runtime (Docker standalone).
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #060d07 0%, #0d1a0e 55%, #111f12 100%)',
          position: 'relative',
        }}
      >
        {/* Tricolor italiano */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, display: 'flex' }}>
          <div style={{ flex: 1, background: '#009246' }} />
          <div style={{ flex: 1, background: '#f8fdf8' }} />
          <div style={{ flex: 1, background: '#ce2b37' }} />
        </div>

        <div
          style={{
            fontSize: 110,
            fontWeight: 700,
            color: '#f8fdf8',
            letterSpacing: -3,
            display: 'flex',
          }}
        >
          Italianto
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 40,
            color: '#4ade80',
            display: 'flex',
          }}
        >
          Aprende italiano con Inteligencia Artificial
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 28,
            color: '#9ca3af',
            display: 'flex',
          }}
        >
          Tutor IA · Lecciones · Pronunciación · Canciones
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, display: 'flex' }}>
          <div style={{ flex: 1, background: '#009246' }} />
          <div style={{ flex: 1, background: '#f8fdf8' }} />
          <div style={{ flex: 1, background: '#ce2b37' }} />
        </div>
      </div>
    ),
    size
  )
}
