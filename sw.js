/* =====================================================================
   PSI Karteikarten — Service Worker
   App-Shell offline, Schriften und CDN im Laufzeit-Cache,
   Supabase-Anfragen immer direkt ins Netz.
   ===================================================================== */
const VERSION = 'psi-2026-07-23-1';
const SHELL   = 'shell-' + VERSION;
const RUNTIME = 'runtime-' + VERSION;

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // einzeln, damit eine fehlende Datei nicht die ganze Installation kippt
    await Promise.all(SHELL_FILES.map(u => cache.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isSupabase(url){
  return url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in');
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Lernstand und Anmeldung nie aus dem Cache bedienen
  if (isSupabase(url)) return;

  // Seitenaufrufe: erst Netz, sonst gespeicherte App-Shell
  if (req.mode === 'navigate'){
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match('./index.html', { ignoreSearch: true });
        return cached || Response.error();
      }
    })());
    return;
  }

  // Alles andere: Cache zuerst, im Hintergrund auffrischen
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: false });
    const network = fetch(req).then(async res => {
      if (res && (res.ok || res.type === 'opaque')){
        const cache = await caches.open(url.origin === self.location.origin ? SHELL : RUNTIME);
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => null);

    return cached || (await network) || new Response('', { status: 504, statusText: 'Offline' });
  })());
});
