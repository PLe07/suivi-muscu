/* Service worker : app hors ligne + notifications push */
const CACHE = "suivi-muscu-v3";
const ASSETS = ["./", "./index.html", "./app.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./vendor/leaflet.js", "./vendor/leaflet.css"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Réseau d'abord (pour recevoir les mises à jour), cache si hors ligne. Les vidéos ne passent pas par le cache. */
self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.indexOf("/videos/") >= 0) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "Suivi muscu", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Suivi muscu", {
    body: d.body || "",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: d.tag || undefined,
    data: { url: d.url || "./#aujourdhui" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.indexOf(self.registration.scope) === 0 && "focus" in c) {
        if ("navigate" in c) c.navigate(target).catch(() => {});
        return c.focus();
      }
    }
    return self.clients.openWindow(target);
  }));
});
