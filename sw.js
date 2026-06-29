const CACHE = "msela-v9";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Third-party requests (Supabase API, CDN library) always go to the network —
  // never cache them, so cloud data is always fresh and POST/auth pass straight through.
  if (url.origin !== self.location.origin) return;
  const isDoc = e.request.mode === "navigate" || e.request.destination === "document";
  if (isDoc) {
    // network-first for the page, so a redeploy shows up right away (cache only as offline fallback)
    e.respondWith(fetch(e.request).then(res => { const c = res.clone(); caches.open(CACHE).then(ca => ca.put("./index.html", c)); return res; }).catch(() => caches.match("./index.html")));
  } else {
    // cache-first for our own icons/static assets
    e.respondWith(caches.match(e.request).then(h => h || fetch(e.request).then(res => { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); return res; })));
  }
});
