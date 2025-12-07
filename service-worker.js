const CACHE_NAME = 'tap-timer-v1';
const APP_SHELL = [
  '/',               // if serving from root
  '/index.html',
  '/manifest.json',
  '/image.svg'
  // add other static assets if you have them (css, icons, js files).
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  // Try cache first, then network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // optionally cache new requests for future use (runtime caching)
        // Only cache GET requests for same-origin HTML/CSS/JS
        try {
          const clone = resp.clone();
          if (event.request.method === 'GET' && resp.status === 200 && resp.type !== 'opaque') {
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
        } catch (e) { /* ignore caching errors */ }
        return resp;
      }).catch(() => {
        // Fallback: if request is for navigation, return cached index.html if present
        if (event.request.mode === 'navigate') {
          return caches.match('/dd.html');
        }
        // else fail
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
