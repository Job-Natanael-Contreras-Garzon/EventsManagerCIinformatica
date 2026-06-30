---
name: PWA_Manifest_Spec
description: >
  Genera el archivo manifest.json completo y válido para la Progressive Web App
  de registro a eventos, incluyendo todos los campos requeridos por los criterios
  de instalabilidad de Chrome y Safari, shortcuts de acciones rápidas,
  screenshots para la pantalla de instalación y configuración de display modes.
---

# PWA_Manifest_Spec

## 🎯 Objetivo de la Habilidad

Producir un **`manifest.json` de producción** que cumpla 100% de los criterios
de instalabilidad PWA de Google Chrome (Lighthouse PWA audit), con íconos en
todas las resoluciones, shortcuts nativos de acciones frecuentes, y screenshots
de la app para la pantalla de instalación enriquecida en Android.

---

## 📥 Datos de Entrada

```ts
interface ManifestInput {
  // Identidad
  appName: string;           // "EventsCIInformatica"
  shortName: string;         // "Eventos CI" (max 12 chars)
  description: string;       // Descripción para tienda/instalación
  lang: "es" | "en";
  dir: "ltr" | "rtl";

  // URLs
  startUrl: string;          // "/" o "/eventos"
  scope: string;             // "/" (debe contener startUrl)

  // Apariencia
  display: "standalone" | "minimal-ui" | "fullscreen";
  orientation: "portrait" | "landscape" | "any";
  themeColor: string;        // "#7C3AED"
  backgroundColor: string;   // "#09090B"

  // Funcionalidad
  categories: string[];      // ["education", "productivity"]
  shortcuts: {
    name: string;
    shortName?: string;
    description?: string;
    url: string;
    iconUrl: string;
  }[];

  // Screenshots para instalación enriquecida (Android 13+)
  screenshots: {
    src: string;
    sizes: string;           // "390x844"
    type: "image/png" | "image/jpeg" | "image/webp";
    formFactor: "narrow" | "wide";
    label: string;
  }[];
}
```

---

## 📐 Reglas de Estilo Inmutables

### 1. Campos Obligatorios para Instalabilidad

Los siguientes campos son **NON-NEGOTIABLE** para pasar el audit de Lighthouse:

| Campo            | Requerimiento                          | Motivo                         |
|------------------|----------------------------------------|--------------------------------|
| `name`           | ≥ 3 caracteres, no vacío              | Identidad en launcher          |
| `short_name`     | ≤ 12 caracteres                        | Texto bajo ícono Android       |
| `start_url`      | Dentro del `scope`                     | URL de arranque de la app      |
| `display`        | `"standalone"` obligatorio             | Apariencia app nativa          |
| `icons`          | Al menos 192px y 512px (ambos PNG)     | Chrome exige ambos             |
| `icons[maskable]`| Al menos uno con `"purpose": "maskable"` | Android Adaptive Icons       |
| `theme_color`    | Color hex válido                       | Barra de estado Android        |
| `background_color`| Color hex válido                      | Splash screen                  |

### 2. Shortcuts — Máximo 4

```
- No más de 4 shortcuts (solo los primeros 4 son procesados por Android)
- Cada shortcut requiere un ícono de 96×96px
- `url` debe estar dentro del `scope`
- `name` ≤ 20 caracteres recomendado
```

### 3. Screenshots para Instalación Enriquecida

```
- formFactor "narrow": retrato móvil (e.g., 390×844)
- formFactor "wide": paisaje tablet (e.g., 1280×800)
- Mínimo 1 screenshot "narrow" para trigger de rich install
- Máximo 8 screenshots totales
- Formato recomendado: WebP para menor peso
```

### 4. Campos Recomendados (SEO y Descubrimiento)

```json
"description": "...",         // Para tiendas web y buscadores
"categories": ["education"],  // W3C Web App Manifest categories
"lang": "es",                 // Idioma principal
"dir": "ltr",                 // Dirección del texto
"prefer_related_applications": false  // No redirigir a Play Store
```

---

## 📤 Formato de Salida

### A) `public/manifest.json` — Completo y Listo para Producción

```json
{
  "name": "EventsCIInformatica",
  "short_name": "Eventos CI",
  "description": "Plataforma de registro y gestión de eventos del CI Informática. Inscríbete, gestiona tus entradas y mantente al día con la agenda.",
  "lang": "es",
  "dir": "ltr",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#7C3AED",
  "background_color": "#09090B",
  "prefer_related_applications": false,
  "categories": ["education", "productivity"],

  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/favicon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    }
  ],

  "shortcuts": [
    {
      "name": "Ver eventos",
      "short_name": "Eventos",
      "description": "Explorar todos los eventos disponibles",
      "url": "/eventos",
      "icons": [{ "src": "/icons/shortcut-eventos.png", "sizes": "96x96" }]
    },
    {
      "name": "Mis registros",
      "short_name": "Mis tickets",
      "description": "Ver mis registros y entradas",
      "url": "/mis-registros",
      "icons": [{ "src": "/icons/shortcut-registros.png", "sizes": "96x96" }]
    },
    {
      "name": "Registrarme",
      "short_name": "Registrar",
      "description": "Registro rápido a un nuevo evento",
      "url": "/registro",
      "icons": [{ "src": "/icons/shortcut-registro.png", "sizes": "96x96" }]
    }
  ],

  "screenshots": [
    {
      "src": "/screenshots/home-portrait.webp",
      "sizes": "390x844",
      "type": "image/webp",
      "form_factor": "narrow",
      "label": "Pantalla principal de eventos"
    },
    {
      "src": "/screenshots/register-portrait.webp",
      "sizes": "390x844",
      "type": "image/webp",
      "form_factor": "narrow",
      "label": "Formulario de registro a evento"
    },
    {
      "src": "/screenshots/ticket-portrait.webp",
      "sizes": "390x844",
      "type": "image/webp",
      "form_factor": "narrow",
      "label": "Confirmación y código QR de entrada"
    }
  ]
}
```

### B) Integración en Next.js App Router

```tsx
// app/manifest.ts  (Next.js 14+ metadata API)
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EventsCIInformatica",
    short_name: "Eventos CI",
    description: "Plataforma de registro y gestión de eventos del CI Informática.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090B",
    theme_color: "#7C3AED",
    icons: [
      { src: "/icons/icon-192.png",          sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

```tsx
// app/layout.tsx — Metadatos complementarios
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | EventsCIInformatica", default: "EventsCIInformatica" },
  description: "Plataforma de registro y gestión de eventos del CI Informática.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eventos CI",
  },
  openGraph: {
    title: "EventsCIInformatica",
    description: "Registrate a los eventos del CI Informática.",
    images: [{ url: "/og/og-image.png", width: 1200, height: 630 }],
  },
};
```

### C) Service Worker — Registro (Next.js)

```ts
// app/_components/ServiceWorkerRegistration.tsx
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  return null;
}
```

---

## ✅ Checklist de Validación del Manifest

### Instalabilidad (Lighthouse PWA)
- [ ] `name` y `short_name` presentes y válidos
- [ ] `start_url` definida y accesible
- [ ] `display: "standalone"` configurado
- [ ] Ícono PNG 192×192 con `purpose: "any"` presente
- [ ] Ícono PNG 512×512 con `purpose: "maskable"` presente
- [ ] `theme_color` y `background_color` en formato hex válido
- [ ] `scope` contiene al `start_url`

### Calidad y UX
- [ ] `short_name` ≤ 12 caracteres
- [ ] `description` entre 30-200 caracteres
- [ ] Shortcuts ≤ 4, cada uno con ícono 96×96
- [ ] Al menos 1 screenshot `narrow` para rich install
- [ ] `prefer_related_applications: false` para no redirigir a Play Store
- [ ] Service Worker registrado en producción
- [ ] Manifest referenciado en `<link rel="manifest">` del HTML
