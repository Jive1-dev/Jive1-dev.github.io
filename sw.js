// Brainforge Service Worker: funktioniert offline. Seite: zuerst Netz (neueste Version), sonst Cache.
const CACHE = 'bf-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './h2c.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Schriften: einmal laden, dann aus dem Cache
  if (url.host.includes('fonts.googleapis.com') || url.host.includes('fonts.gstatic.com')) {
    e.respondWith(caches.open(CACHE).then(async (c) => (await c.match(req)) ?? fetch(req).then((r) => (c.put(req, r.clone()), r))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Eigene Dateien: Netz zuerst (damit Updates sofort da sind), offline aus dem Cache
  e.respondWith(
    fetch(req)
      .then((r) => {
        if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone()));
        return r;
      })
      .catch(async () => (await caches.match(req)) ?? (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())),
  );
});
