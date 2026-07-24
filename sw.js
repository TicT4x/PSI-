/* =====================================================================
   Karteikarten — Service Worker
   App-Shell fest im Cache, Fachdateien bevorzugt frisch aus dem Netz
   (damit neue Karten sofort ankommen), im Offline-Fall aus dem Cache.
   ===================================================================== */
const VERSION = 'karten-2026-07-23-3';
const SHELL   = 'shell-' + VERSION;
const DATEN   = 'faecher-' + VERSION;
const EXTERN  = 'extern-' + VERSION;

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './faecher/index.json'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await Promise.all(SHELL_FILES.map(u => cache.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![SHELL, DATEN, EXTERN].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const istSupabase = url => url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in');
const istFachdatei = url => url.origin === self.location.origin && url.pathname.includes('/faecher/');

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Lernstand und Anmeldung nie aus dem Cache
  if (istSupabase(url)) return;

  // Seitenaufrufe: erst Netz, sonst App-Shell
  if (req.mode === 'navigate'){
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        (await caches.open(SHELL)).put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match('./index.html', { ignoreSearch: true })) || Response.error();
      }
    })());
    return;
  }

  // Fachdateien: erst Netz, damit Kartenaenderungen sofort sichtbar sind
  if (istFachdatei(url)){
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) (await caches.open(DATEN)).put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req, { ignoreSearch: true });
        return cached || new Response('', { status: 504, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Rest: Cache zuerst, im Hintergrund auffrischen
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then(async res => {
      if (res && (res.ok || res.type === 'opaque')){
        const cache = await caches.open(url.origin === self.location.origin ? SHELL : EXTERN);
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => null);
    return cached || (await network) || new Response('', { status: 504, statusText: 'Offline' });
  })());
});
