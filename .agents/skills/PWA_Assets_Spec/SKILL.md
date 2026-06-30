---
name: PWA_Assets_Spec
description: >
  Especifica y genera todos los assets visuales requeridos para una Progressive
  Web App de registro a eventos: íconos adaptativos, splash screens, maskable
  icons y open graph images, con dimensiones y formatos exactos según los
  estándares de Android, iOS y escritorio.
---

# PWA_Assets_Spec

## 🎯 Objetivo de la Habilidad

Producir la **especificación completa de assets visuales PWA** para la app de
registro a eventos, garantizando instalabilidad en Android, iOS (A2HS) y
escritorio, con íconos a todas las resoluciones requeridas, splash screens
adaptativas y metadatos HTML correctos.

---

## 📥 Datos de Entrada

```ts
interface PWAAssetsInput {
  // Identidad de la app
  appName: string;           // e.g. "EventsCIInformatica"
  shortName: string;         // e.g. "Eventos CI"  (max 12 chars)
  themeColor: string;        // e.g. "#7C3AED"  (hex)
  backgroundColor: string;   // e.g. "#09090B"  (hex)

  // Logo fuente (SVG preferido, mínimo 512×512px)
  logoSourcePath: string;

  // Categoría de la app (para el manifest)
  category: "education" | "productivity" | "social" | "entertainment";

  // Idioma por defecto
  lang: "es" | "en";
}
```

---

## 📐 Reglas de Estilo Inmutables

### 1. Grilla de Íconos Obligatorios

| Uso                    | Tamaño      | Formato  | Purpose       |
|------------------------|-------------|----------|---------------|
| Android launcher       | 192×192     | PNG      | `any`         |
| Android maskable       | 512×512     | PNG      | `maskable`    |
| iOS A2HS (legacy)      | 180×180     | PNG      | `apple-touch` |
| iOS iPad               | 167×167     | PNG      | `apple-touch` |
| Favicon browser tab    | 32×32       | ICO/PNG  | `any`         |
| Favicon HD             | 96×96       | PNG      | `any`         |
| OG Image               | 1200×630    | PNG/JPEG | social share  |
| Splash Android         | 2160×3840   | PNG      | splash        |
| Splash iOS (375pt)     | 750×1334    | PNG      | splash        |

### 2. Zona Segura del Maskable Icon
> El logo principal debe quedar dentro del **80% del área central** (safe zone).
> Los 10% de cada borde son zona de recorte en Android.

### 3. Colores en Assets
- Fondo del splash/icon: siempre `backgroundColor` del input
- Logo/símbolo: siempre contraste AAA contra `backgroundColor`
- Borde de favicon: transparente (sin fondo blanco)

### 4. Nomenclatura de Archivos
```
public/
  icons/
    icon-192.png
    icon-512-maskable.png
    apple-touch-icon.png
    favicon-32.png
    favicon-96.png
  splash/
    splash-android.png
    splash-ios-375.png
  og/
    og-image.png
```

---

## 📤 Formato de Salida

### A) Especificación JSON de Assets
```json
{
  "assets": [
    {
      "filename": "public/icons/icon-192.png",
      "width": 192,
      "height": 192,
      "format": "png",
      "purpose": "any",
      "description": "Ícono principal para launcher Android"
    },
    {
      "filename": "public/icons/icon-512-maskable.png",
      "width": 512,
      "height": 512,
      "format": "png",
      "purpose": "maskable",
      "safeZonePercent": 80,
      "description": "Maskable icon para Android adaptive icons"
    }
  ]
}
```

### B) Metadatos HTML (`<head>`)
```html
<!-- PWA / iOS -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="[shortName]" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

<!-- Android / Chrome -->
<meta name="theme-color" content="[themeColor]" />
<link rel="manifest" href="/manifest.json" />

<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
<link rel="icon" type="image/png" sizes="96x96" href="/icons/favicon-96.png" />

<!-- Open Graph -->
<meta property="og:image" content="/og/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### C) Script de Generación (Sharp / Node.js)
```ts
// scripts/generate-pwa-assets.ts
import sharp from "sharp";
import { join } from "path";

const SOURCE = join(process.cwd(), "src/assets/logo.svg");
const OUT    = join(process.cwd(), "public");

const ICONS = [
  { name: "icons/icon-192.png",          size: 192,  purpose: "any"      },
  { name: "icons/icon-512-maskable.png", size: 512,  purpose: "maskable" },
  { name: "icons/apple-touch-icon.png",  size: 180,  purpose: "apple"    },
  { name: "icons/favicon-32.png",        size: 32,   purpose: "any"      },
  { name: "icons/favicon-96.png",        size: 96,   purpose: "any"      },
];

async function generate() {
  for (const icon of ICONS) {
    await sharp(SOURCE)
      .resize(icon.size, icon.size)
      .png()
      .toFile(join(OUT, icon.name));
    console.log(`✅ Generated: ${icon.name}`);
  }
}

generate();
```

---

## ✅ Checklist de Validación

- [ ] Todas las 9 resoluciones de la grilla están generadas
- [ ] Maskable icon: logo dentro del 80% de zona segura
- [ ] `backgroundColor` correcto en splash screens
- [ ] Metadatos HTML incluidos en `app/layout.tsx` (Next.js App Router)
- [ ] Archivos en `/public` accesibles sin autenticación
- [ ] OG image tiene texto legible en thumbnail (mín. 24sp equivalente)
- [ ] Sin logos con fondo blanco en variante `any`
