// Lets the app open with no internet. The pictures themselves are kept by Firebase on the device;
// this keeps the app, the pictures to colour, the icons, the font and the Firebase code.
// The page is fetched fresh when online (so updates arrive) and from the copy when offline.
// Everything else is served from the copy and refreshed in the background.
const CACHE = 'colouring-v2';
const PICTURES = ['pip', 'posy', 'cookie-monster', 'elmo', 'zog', 'highway-rat', 'gruffalos-child', 'gruffalo-friends',
  'snail-and-whale', 'smartest-giant', 'room-on-the-broom', 'squash-and-squeeze', 'shrek', 'sulley', 'unicorn',
  'go-jetters', 'go-jetters-robots', 'glitchbots', 'duggee-hug'];
const FIREBASE = 'https://www.gstatic.com/firebasejs/10.12.2/';
const START = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  ...PICTURES.map(p => 'templates/' + p + '.png'),
  FIREBASE + 'firebase-app-compat.js', FIREBASE + 'firebase-firestore-compat.js'];

self.addEventListener('install', e => {
  // cache.add() refuses other sites' files (they come back "opaque"), so fetch and store them directly.
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(START.map(u => {
    const req = new Request(u, { mode: u.startsWith('http') ? 'no-cors' : 'same-origin' });
    return fetch(req).then(res => (res.ok || res.type === 'opaque') && c.put(req, res)).catch(() => {});
  }))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Firebase's own connection to the database is left alone; it handles offline itself.
const KEEP = url => url.origin === self.location.origin || url.href.startsWith(FIREBASE) ||
  url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || !KEEP(url)) return;
  if (req.mode === 'navigate') {
    // The page: fresh when online (give up after 4 s on a poor connection), else the saved copy.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000))]);
        if (res.ok) cache.put('./', res.clone());
        return res;
      } catch (err) {
        return (await cache.match('./')) || (await cache.match(req)) || Response.error();
      }
    })());
    return;
  }
  // Everything else: the saved copy straight away, refreshed in the background.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: url.origin === self.location.origin });
    const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    return (await fresh) || Response.error();
  })());
});
