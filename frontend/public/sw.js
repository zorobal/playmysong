// Basic service worker for PWA - handles caching safely
const CACHE_NAME = 'playmysong-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(caches.delete)
    ))
  );
  self.clients.claim();
});

// Safely handle fetch events - skip problematic requests
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls, socket connections, and problematic URLs
  const url = new URL(event.request.url);
  if (url.hostname === 'localhost' && url.port === '4000' ||
      url.protocol === 'chrome-extension:' ||
      event.request.url.includes('socket.io') ||
      event.request.url.includes('/api/')) {
    return; // Don't handle these requests
  }

  // For HTML pages, try network first
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Only cache successful responses
          if (response.ok && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache or offline page
          return caches.match(event.request) || caches.match('/index.html');
        })
    );
    return;
  }

  // For other assets, try cache first then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Only cache successful responses
          if (response.ok && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
  );
});
