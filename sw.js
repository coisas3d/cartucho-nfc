// Service worker: abre mais rápido e funciona em parte sem internet.
// Guarda a casca do site e os arquivos do emulador. ROMs e núcleos ficam por conta do EmulatorJS (IndexedDB).
const VERSAO = 'c3d-v1';
const CASCA = ['./', 'index.html', 'c3dlogo.png', 'manifest.json', 'jogos.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => Promise.all(CASCA.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function guardavel(r) { return r && (r.ok || r.type === 'opaque'); }
async function redeDepois(req, cache) {
  const r = await fetch(req);
  if (guardavel(r)) cache.put(req, r.clone());
  return r;
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.indexOf('/roms/') > -1 || req.headers.has('range')) return;

  // páginas do próprio site: rede primeiro (para receber atualizações), cache se estiver offline
  if (req.mode === 'navigate' && url.origin === location.origin) {
    e.respondWith(caches.open(VERSAO).then(async c => {
      try { const r = await fetch(req); if (r.ok && /index\.html$|\/$/.test(url.pathname)) c.put('index.html', r.clone()); return r; }
      catch (err) { return (await c.match(req, { ignoreSearch: true })) || (await c.match('index.html', { ignoreSearch: true })) || Response.error(); }
    }));
    return;
  }
  // arquivos pequenos do site: usa o cache e atualiza em segundo plano
  if (url.origin === location.origin && /\.(json|png|jpg|webp|css|js)$/i.test(url.pathname)) {
    e.respondWith(caches.open(VERSAO).then(async c => {
      const hit = await c.match(req);
      const rede = redeDepois(req, c).catch(() => hit);
      return hit || rede;
    }));
    return;
  }
  // emulador e bibliotecas externas (menos os núcleos pesados)
  const externo = /cdn\.emulatorjs\.org\/.+\/data\//.test(req.url) || /unpkg\.com|cdnjs\.cloudflare\.com/.test(url.hostname);
  if (externo && req.url.indexOf('/cores/') < 0) {
    e.respondWith(caches.open(VERSAO).then(async c => {
      const hit = await c.match(req);
      const rede = redeDepois(req, c).catch(() => hit);
      return hit || rede;
    }));
  }
});
