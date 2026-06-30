"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registrado con éxito en el scope:", reg.scope))
        .catch((err) => console.error("Error al registrar el Service Worker:", err));
    }
  }, []);

  return null;
}
