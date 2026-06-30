---
name: Responsive_Layout_Guard
description: >
  Audita y corrige layouts en Next.js/Tailwind CSS para garantizar que ningún
  componente cause overflow horizontal desde 320px. Verifica breakpoints,
  anchos máximos, grids y flexbox para el flujo móvil-first de la app de
  registro a eventos.
---

# Responsive_Layout_Guard

## 🎯 Objetivo de la Habilidad

Actuar como **guardián de layout responsivo**: detectar y corregir cualquier
patrón de CSS/Tailwind que cause scroll horizontal, elementos cortados o
superposición de texto en pantallas desde 320px. Generar layouts de página
seguros para la app de registro a eventos con soporte completo de orientación
portrait y landscape.

---

## 📥 Datos de Entrada

```ts
interface LayoutAuditInput {
  // Archivo TSX o fragmento de código a auditar
  sourceCode: string;

  // Viewport objetivo más crítico
  minViewportPx: number; // default: 320

  // Tipo de pantalla a validar
  screenType: "phone" | "tablet" | "desktop" | "all";

  // Orientación a validar
  orientation: "portrait" | "landscape" | "both";

  // Paleta de colores (para validar contraste)
  colorTokens?: Record<string, string>;
}
```

---

## 📐 Reglas de Estilo Inmutables

### 1. Contenedores Seguros

**Contenedor de página (máximo nivel)**
```tsx
// ✅ CORRECTO
<main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">

// ❌ PROHIBIDO
<main className="w-[1200px]">         // ancho fijo
<main style={{ width: "1200px" }}>   // inline style
```

**Contenedor de sección**
```tsx
// ✅ CORRECTO
<section className="w-full overflow-hidden">

// ❌ PROHIBIDO
<section className="w-[90vw] overflow-x-scroll">
```

### 2. Grid Responsivo Obligatorio

```tsx
// Grid de tarjetas de eventos
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

// Grid de formulario de registro
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Grid de estadísticas
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
```

### 3. Patrones Prohibidos (Anti-patterns)

```
❌  min-w-[valor-fijo]         → Reemplazar con min-w-0
❌  w-[valor > 100%]          → Usar w-full o max-w-*
❌  text-[tamaño-fijo-grande] → Escalar con sm:/md: breakpoints  
❌  flex sin flex-wrap         → Agregar flex-wrap en móvil
❌  gap-* sin min-w-0 en hijos → Puede causar overflow en flex
❌  absolute con right-*       → Verificar no exceda el viewport
❌  whitespace-nowrap en textos largos → Usar break-words o truncate
```

### 4. Navegación Móvil

```tsx
// ✅ Navbar segura en 320px
<nav className="
  fixed bottom-0 left-0 right-0 z-50
  h-16 bg-zinc-900/95 backdrop-blur-md
  border-t border-zinc-800
  flex items-center justify-around
  px-2 safe-area-inset-bottom
">

// ✅ Header seguro
<header className="
  sticky top-0 z-40 w-full
  bg-zinc-900/95 backdrop-blur-md
  border-b border-zinc-800
  px-4 sm:px-6
  h-14 sm:h-16
  flex items-center justify-between
">
```

### 5. Imágenes y Media Segura

```tsx
// ✅ Imagen responsiva
<Image
  src={src}
  alt={alt}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>

// Wrapper necesario
<div className="relative w-full aspect-video overflow-hidden rounded-xl">
  <Image ... />
</div>
```

---

## 📤 Formato de Salida

### A) Reporte de Auditoría
```json
{
  "auditResult": {
    "component": "EventCard",
    "issues": [
      {
        "severity": "critical",
        "line": 12,
        "pattern": "w-[480px]",
        "reason": "Ancho fijo causa overflow en viewports < 480px",
        "fix": "w-full max-w-sm"
      },
      {
        "severity": "warning",
        "line": 28,
        "pattern": "flex gap-4",
        "reason": "Sin flex-wrap, puede causar overflow con muchos hijos",
        "fix": "flex flex-wrap gap-4"
      }
    ],
    "passedChecks": ["max-w-screen-xl", "px-4 sm:px-6", "grid-cols-1"],
    "overallScore": 72
  }
}
```

### B) Código Corregido (diff format)
```diff
- <div className="w-[480px] flex gap-4">
+ <div className="w-full max-w-sm flex flex-wrap gap-4 min-w-0">

- <p className="whitespace-nowrap text-[18px]">
+ <p className="truncate text-base sm:text-lg">
```

### C) Layout de Página Completo — Ejemplo Validado
```tsx
// app/(events)/layout.tsx
export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header sticky */}
      <header className="sticky top-0 z-40 w-full bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 h-14 sm:h-16 flex items-center px-4 sm:px-6">
        {/* Logo + Nav */}
      </header>

      {/* Contenido principal */}
      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Nav (móvil) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around px-2 sm:hidden">
        {/* Nav items */}
      </nav>
    </div>
  );
}
```

---

## ✅ Checklist de Validación de Layout

- [ ] Sin elementos con ancho fijo que excedan 320px
- [ ] Todos los contenedores usan `w-full` + `max-w-*` + `mx-auto`
- [ ] Grids tienen columna única en base (`grid-cols-1`)
- [ ] Flex containers tienen `flex-wrap` cuando tienen múltiples hijos
- [ ] Textos largos usan `truncate` o `break-words`
- [ ] Imágenes tienen wrapper `overflow-hidden` y son `w-full`
- [ ] Bottom padding compensa navbar fija (`pb-16` o `pb-24`)
- [ ] Layout probado en orientación landscape a 568px de ancho
