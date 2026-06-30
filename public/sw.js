const CACHE_NAME = "events-manager-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Manejo básico de peticiones para cumplir con los requisitos de PWA.
  // En caso de estar offline, intenta recuperar de la caché si existe.
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
