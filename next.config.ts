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
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
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
    const italiantoappUrl = process.env.ITALIANTOAPP_INTERNAL_URL || 'http://italiantoapp:3000'
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
