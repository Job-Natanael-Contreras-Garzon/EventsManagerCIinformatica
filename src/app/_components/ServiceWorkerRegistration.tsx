"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    const isLocalhost = Boolean(
      window.location.hostname === "localhost" ||
        window.location.hostname === "[::1]" ||
        window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );

    if ("serviceWorker" in navigator && (process.env.NODE_ENV === "production" || isLocalhost)) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registrado con éxito en el scope:", reg.scope))
        .catch((err) => console.error("Error al registrar el Service Worker:", err));
    }
  }, []);

  return null;
}
