// Basic service worker for PWA
// IMPORTANT: keep navigation requests fresh to avoid stale UI.
const CACHE_NAME = 'warepick-v3'
const urlsToCache = ['/', '/picking', '/settings']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )

  // Activate updated SW ASAP
  self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  // For page navigations: network-first (prevents old HTML/JS from being stuck)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    )
    return
  }

  // For other requests: cache-first fallback to network
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )

  // Take control of existing pages
  self.clients.claim()
})
