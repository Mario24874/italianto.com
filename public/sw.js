const CACHE = 'italianto-v1'
const PRECACHE = ['/', '/manifest.json', '/logo_Italianto.png']

self.addEventListener('install', e => {
  // Do NOT skipWaiting — let the client decide when to activate (enables update banner UX)
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  // Never intercept navigation requests — Next.js SSR must handle them directly
  // (avoids "redirect mode is not follow" errors on page loads)
  if (e.request.mode === 'navigate') return
  const url = new URL(e.request.url)
  // Never intercept: API calls, Clerk, Stripe, Supabase, ElevenLabs, Gemini
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('clerk') ||
    url.hostname.includes('stripe') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('elevenlabs') ||
    url.hostname.includes('googleapis')
  ) return

  // Network-first with cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

// When client posts SKIP_WAITING, activate the new SW immediately
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting()
})
