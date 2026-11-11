/* Offline-Modus: lädt immer zuerst aus dem Netz und greift nur ohne Verbindung auf die gespeicherte Kopie zurück. */
const CACHE = 'ibw-studium-v3';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'assets/style.css', 'assets/data.js', 'assets/app.js', 'assets/qrcode.js',
  'assets/fonts/figtree.woff2', 'assets/fonts/bricolage.woff2', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png',
  'data/stundenplan.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mine = url.origin === self.location.origin, plan = url.hostname === 'raw.githubusercontent.com';
  if (!mine && !plan) return; // GitHub-API (Abgleich) und Links nie zwischenspeichern
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 6000))]);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => ws.length ? ws[0].focus() : self.clients.openWindow('./')));
});
