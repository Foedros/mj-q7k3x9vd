// Guarda el juego en el dispositivo para que abra sin conexion.
// Con red: siempre la ultima version (sin cache del navegador).
// Sin red o si tarda mas de 3 s: la copia guardada.
var CACHE = 'mj-v2';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) {
        return fetch('./index.html', { cache: 'no-store' }).then(function (r) {
          if (!r.ok) throw new Error('sin index');
          var base = new URL('./', self.location).href;
          return Promise.all([c.put(base, r.clone()), c.put(base + 'index.html', r)]);
        });
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) {
        return Promise.all(ks.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  var key = e.request.url.split('?')[0].split('#')[0];
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      var net = fetch(key, { cache: 'no-store' }).then(function (r) {
        if (r && r.ok) c.put(key, r.clone());
        return r;
      });
      var fromNet = net.catch(function () { return c.match(key); });
      var slow = new Promise(function (res) { setTimeout(res, 3000); })
        .then(function () { return c.match(key); })
        .then(function (hit) { return hit || fromNet; });
      return Promise.race([fromNet, slow]);
    })
  );
});
