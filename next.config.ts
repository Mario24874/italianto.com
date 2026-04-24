import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
    ],
    unoptimized: false,
  },
  async headers() {
    const supabaseHost = 'zhpnoohdefnigumjgxbc.supabase.co'
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.italianto.com https://*.clerk.accounts.dev https://js.stripe.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' https://${supabaseHost} https://*.supabase.co wss://${supabaseHost} https://api.anthropic.com https://generativelanguage.googleapis.com https://api.deepl.com https://api.stripe.com https://api.emailjs.com https://*.clerk.accounts.dev https://clerk.italianto.com`,
      "img-src 'self' data: blob: https://img.clerk.com https://*.supabase.co https://images.unsplash.com https://images.pexels.com https://*.cloudinary.com",
      "media-src 'self' https://*.supabase.co blob:",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        source: '/api/stripe/webhook',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/api/clerk/webhook',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
  async rewrites() {
    const dialoghiUrl = process.env.DIALOGHI_STUDIO_INTERNAL_URL || 'http://dialoghi-studio:3000'
    const italiantoappUrl = process.env.ITALIANTOAPP_INTERNAL_URL || 'http://italiantoapp:80'
    return [
      {
        source: '/studio/:path*',
        destination: `${dialoghiUrl}/studio/:path*`,
      },
      {
        source: '/app/:path*',
        destination: `${italiantoappUrl}/app/:path*`,
      },
    ]
  },
}

export default nextConfig
