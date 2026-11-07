/* Black Rock MC mudou para https://coisas3d.github.io/brmc/ - este service worker só desliga o modo offline antigo */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  self.registration.unregister()
    .then(() => self.clients.matchAll({ type: 'window' }))
    .then(cs => cs.forEach(c => c.navigate(c.url)))
));
