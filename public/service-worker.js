const CACHE_NAME = 'sunday-school-hub-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/vite.svg',
  '/manifest.json',
  // Add your app's main bundled JS and CSS files here.
  // For Vite, these paths are often generated with hashes (e.g., /assets/index-XXXX.js).
  // A more advanced PWA setup would dynamically cache these or use a build plugin.
  // For now, we'll rely on the browser's default caching for these or dynamic caching.
  // Example: '/assets/index-xxxxxxxx.js', '/assets/index-yyyyyyyy.css'
  // You'll need to inspect your build output to get the exact paths if you want to pre-cache them.
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Opened cache');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Service Worker: Failed to cache some URLs:', error);
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // No cache hit - fetch from network
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and can only be consumed once. We need to consume it once
            // to cache it and once for the browser to fetch it.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch((error) => {
        console.error('Service Worker: Fetch failed:', error);
        // You could return an offline page here if desired
        // return caches.match('/offline.html');
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});