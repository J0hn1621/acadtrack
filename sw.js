const CACHE_NAME = 'acadtrack-v1.4';
const URLS_TO_CACHE = [
  '/acadtrack/',
  '/acadtrack/index.html',
  '/acadtrack/dashboard.html',
  '/acadtrack/schedule.html',
  '/acadtrack/calendar.html',
  '/acadtrack/about.html',
  '/acadtrack/manifest.json',
  '/acadtrack/icon-192.png',
  '/acadtrack/icon-512.png'
];

// Install: cache all pages
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE.map(function(url) {
        return new Request(url, { cache: 'reload' });
      })).catch(function() {
        // If caching fails (e.g. icon missing), continue anyway
      });
    })
  );
});

// Activate: delete old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', function(event) {
  // Only handle GET requests for same-origin pages
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Cache successful responses for HTML pages
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback — return the main page
        return caches.match('/acadtrack/index.html');
      });
    })
  );
});
