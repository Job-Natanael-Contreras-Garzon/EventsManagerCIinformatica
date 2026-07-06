"use client";

import { useState, useEffect } from "react";
import { subscribePushAction, unsubscribePushAction } from "@/modules/notifications/actions/push.actions";

// Clave VAPID pública expuesta por Next.js
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Convertir base64 URL-safe de la clave pública VAPID a Uint8Array para el navegador
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationBell() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    // Verificar soporte de Service Worker y Push
    const hasSW = "serviceWorker" in navigator;
    const hasPush = "PushManager" in window;
    
    if (hasSW && hasPush && VAPID_PUBLIC_KEY) {
      setIsSupported(true);
      setPermissionState(Notification.permission);
      checkSubscription();
    } else {
      setIsSupported(false);
      setPermissionState("unsupported");
      setLoading(false);
    }
  }, []);

  // Verifica si el navegador ya tiene una suscripción push activa
  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch (error) {
      console.error("[Notification Bell] Error al verificar suscripción push:", error);
    } finally {
      setLoading(false);
    }
  }

  // Activa las notificaciones en este dispositivo
  async function subscribeUser() {
    setLoading(true);
    try {
      // 1. Solicitar permisos de notificación
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== "granted") {
        alert("Permiso para notificaciones denegado. Actívalo en la configuración de tu navegador.");
        setLoading(false);
        return;
      }

      // 2. Registrar/obtener suscripción push en el SW
      const reg = await navigator.serviceWorker.ready;
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY!);
      
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      // 3. Serializar y guardar en el servidor mediante la Server Action
      const subJson = sub.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Estructura de suscripción push inválida.");
      }

      const result = await subscribePushAction({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setIsSubscribed(true);
    } catch (error: any) {
      console.error("[Notification Bell] Error al suscribirse a notificaciones:", error);
      alert(`No se pudo activar las notificaciones: ${error.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  }

  // Desactiva las notificaciones en este dispositivo
  async function unsubscribeUser() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      
      if (sub) {
        // 1. Eliminar en el servidor
        const result = await unsubscribePushAction(sub.endpoint);
        if (!result.success) {
          throw new Error(result.error);
        }

        // 2. Desuscribir en el navegador
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (error: any) {
      console.error("[Notification Bell] Error al cancelar suscripción push:", error);
      alert(`No se pudo desactivar las notificaciones: ${error.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    if (loading) return;
    if (isSubscribed) {
      await unsubscribeUser();
    } else {
      await subscribeUser();
    }
  }

  // Si no es soportado, no mostramos nada en el Header
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={
        isSubscribed
          ? "Desactivar notificaciones en este dispositivo"
          : permissionState === "denied"
          ? "Permiso denegado (Actívalo en tu navegador)"
          : "Activar notificaciones en este dispositivo"
      }
      className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky select-none cursor-pointer ${
        loading
          ? "bg-brand-blue/10 border-brand-blue/20 opacity-60 cursor-wait"
          : isSubscribed
          ? "bg-brand-sky/15 border-brand-sky/40 text-brand-sky hover:bg-brand-sky/25 hover:border-brand-sky/60 shadow-sm shadow-brand-sky/10 active:scale-95"
          : permissionState === "denied"
          ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-95"
          : "bg-brand-blue/20 border-brand-blue/30 text-brand-sky/60 hover:text-brand-sky hover:bg-brand-blue/35 active:scale-95"
      }`}
    >
      {loading ? (
        // Spinner de carga
        <svg className="animate-spin h-5.5 w-5.5 text-brand-sky/80" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        // Icono de campana
        <svg className={`w-5.5 h-5.5 transition-all duration-300 ${isSubscribed ? "animate-[wiggle_1s_ease-in-out_infinite]" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isSubscribed ? (
            // Campana activa (rellena y encendida)
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                fill="currentColor"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
              {/* Indicador LED de notificación activa */}
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 border border-brand-navy animate-pulse" />
            </>
          ) : permissionState === "denied" ? (
            // Campana tachada (permiso denegado)
            <>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3l18 18" className="text-rose-500" />
            </>
          ) : (
            // Campana normal apagada
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          )}
        </svg>
      )}
    </button>
  );
}
