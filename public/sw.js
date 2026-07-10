// Minimal service worker for Sunantha Hotel PWA.
// Strategy:
//   - HTML pages (navigation): always network; never cache authenticated HTML.
//   - Static assets (_next/static, /icon.svg, /vendor): cache-first.
//   - API + Supabase: bypass cache entirely (always live data).
// Cache name versions on every deploy via the BUILD_ID query if needed; for now
// the SW updates whenever its body changes, which prompts skip-waiting below.

const CACHE = 'sunantha-v2';
const ASSETS_PREFIX = ['/_next/static/', '/icon', '/apple-icon', '/manifest.webmanifest', '/favicon'];
const STATIC_FILES = ['/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(STATIC_FILES).catch(() => {});
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache Supabase or our own API
  if (url.hostname.endsWith('.supabase.co') || url.pathname.startsWith('/api/')) return;

  // Cache-first for static assets
  if (ASSETS_PREFIX.some(p => url.pathname.startsWith(p))) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }

  // HTML can contain deployment-specific React payloads and authenticated data.
  // Never cache it: mixing old HTML with new hashed chunks causes a blank screen.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request, { cache: 'no-store' });
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match('/offline.html')) || Response.error();
      }
    })());
  }
});
