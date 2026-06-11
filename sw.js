// Baufox Service Worker – einfacher Offline-Cache
const CACHE = "baufox-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Nur eigene GET-Anfragen cachen (keine Supabase-API)
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const kopie = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, kopie));
        return resp;
      })
      .catch(() =>
        caches.match(e.request).then(r => r || caches.match("/index.html"))
      )
  );
});
