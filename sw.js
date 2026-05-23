/* ENERPRO — Service Worker (static shell cache) */
var CACHE = 'enerpro-static-v2';
var SHELL = [
  '/',
  '/index.html',
  '/js/app.js',
  '/enerprologo.jpg',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

function isShellRequest(url) {
  if (url.origin !== self.location.origin) return false;
  if (SHELL.indexOf(url.pathname) !== -1) return true;
  return url.pathname.indexOf('/icons/') === 0;
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE; }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);

  /* Navigation: network first, offline fallback to cached shell */
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match('/index.html');
      })
    );
    return;
  }

  if (!isShellRequest(url)) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var network = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          caches.open(CACHE).then(function(cache) {
            cache.put(event.request, response.clone());
          });
        }
        return response;
      });
      return cached || network;
    })
  );
});
