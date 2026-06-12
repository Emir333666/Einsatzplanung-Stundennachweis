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

// ─── Push-Benachrichtigungen (Ton & Banner auch bei geschlossener App) ───
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { text: e.data ? e.data.text() : "" }; }
  try { if (navigator.setAppBadge) navigator.setAppBadge(1); } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(d.titel || "Baufox", {
      body: d.text || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "baufox-push",
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  try { if (navigator.clearAppBadge) navigator.clearAppBadge(); } catch (_) {}
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
      for (const w of ws) { if ("focus" in w) return w.focus(); }
      return clients.openWindow("/");
    })
  );
});
