const CACHE_NAME = 'sunday-school-hub-v2';
const urlsToCache = [
  '/',
  '/index.html',
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
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith('/@vite') || requestUrl.pathname.startsWith('/src/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch((error) => {
        console.error('Service Worker: Fetch failed:', error);
        return caches.match(event.request);
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
