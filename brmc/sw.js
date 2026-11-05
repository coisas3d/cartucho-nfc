/* Black Rock MC - The Game | modo offline (service worker) */
const VERSAO = 'brmc-v3.1';
const ARQUIVOS = ['./', 'index.html', 'manifest.json', 'dados.js', 'som.js', 'arte.js', 'jogo.js', 'hd/car_front.png', 'hd/car_rear.png', 'hd/carreta_rear.png', 'hd/emblema_128.png', 'hd/emblema_192.png', 'hd/emblema_64.png', 'hd/foto_gs1300.png', 'hd/foto_gs850.png', 'hd/foto_versys.png', 'hd/moto_front.png', 'hd/moto_rear.png', 'hd/piloto.png', 'hd/piloto_gs1300.png', 'hd/piloto_leosao.png', 'hd/pine.png', 'hd/qr_jogo.png', 'hd/retrato_jefao.png', 'hd/retrato_jellison.png', 'hd/retrato_leosao.png', 'hd/rock.png', 'hd/truck_front.png', 'hd/truck_rear.png'];
const EXTERNOS = ['https://unpkg.com/peerjs@1.5.1/dist/peerjs.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS).then(() => Promise.all(EXTERNOS.map(u => c.add(u).catch(() => {}))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('brmc-') && k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// arquivos do jogo e fontes: usa o cache e atualiza em segundo plano | ranking online: sempre rede
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.pathname.includes('/rest/v1/') || u.hostname.endsWith('peerjs.com')) return;
  e.respondWith(caches.open(VERSAO).then(c => c.match(r, { ignoreSearch: u.origin === location.origin }).then(hit => {
    const rede = fetch(r).then(resp => { if (resp && (resp.ok || resp.type === 'opaque')) c.put(r, resp.clone()); return resp; }).catch(() => hit);
    return hit || rede;
  })));
});
