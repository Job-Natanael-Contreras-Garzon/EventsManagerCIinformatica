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

// ─────────────────────────────────────────────
// Evento: Push Notification
// Escucha notificaciones push entrantes y las muestra
// ─────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Events Manager", body: "Nueva actualización en la plataforma." };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Events Manager", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: "/assets/logo-192.png", // Icono por defecto si existe
    badge: "/assets/logo-192.png",
    data: {
      url: data.url || "/admin/dashboard",
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: "explore", title: "Ver Detalle" }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─────────────────────────────────────────────
// Evento: Click en Notificación
// Maneja la acción al hacer clic sobre la notificación push
// ─────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data?.url || "/admin/dashboard", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Buscar si ya hay una pestaña abierta del sitio
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then(() => {
            if ("navigate" in client) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      // Si no hay pestañas abiertas, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
