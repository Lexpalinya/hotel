// Minimal service worker for Sunantha Hotel PWA.
// Strategy:
//   - HTML pages (navigation): network-first, fall back to cache, then offline page.
//   - Static assets (_next/static, /icon.svg, /vendor): cache-first.
//   - API + Supabase: bypass cache entirely (always live data).
// Cache name versions on every deploy via the BUILD_ID query if needed; for now
// the SW updates whenever its body changes, which prompts skip-waiting below.

const CACHE = 'sunantha-v1';
const ASSETS_PREFIX = ['/_next/static/', '/icon', '/apple-icon', '/manifest.webmanifest', '/favicon'];
const STATIC_FILES = ['/'];

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

  // Network-first for navigations (HTML)
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(request);
        if (res.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, res.clone());
        }
        return res;
      } catch {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request);
        return cached || new Response(
          '<!doctype html><html lang="lo"><meta charset="utf-8"><title>Offline</title><body style="font:16px system-ui;padding:40px;text-align:center;color:#3a2c20;background:#f0eee9"><h1 style="font-size:24px">ບໍ່ມີສັນຍານ</h1><p>ກະລຸນາກວດສອບການເຊື່ອມຕໍ່ ແລະ ລອງໃໝ່</p><button onclick="location.reload()" style="padding:10px 20px;background:#c96442;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer">ລອງໃໝ່</button></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
  }
});
