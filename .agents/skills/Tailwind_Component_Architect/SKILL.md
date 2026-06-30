---
name: Tailwind_Component_Architect
description: >
  Diseña y genera componentes TSX de Next.js atómicos usando Tailwind CSS,
  optimizados para interacción táctil móvil en una app de registro a eventos.
  Aplica mobile-first breakpoints, touch targets de al menos 44px, y tokens
  de diseño consistentes a través de variantes de componentes.
---

# Tailwind_Component_Architect

## 🎯 Objetivo de la Habilidad

Construir una **librería de componentes atómicos y moleculares** en TSX para Next.js
(App Router) usando exclusivamente Tailwind CSS. Cada componente es autosuficiente,
sin scroll horizontal desde 320px, con áreas táctiles ≥ 44px y soporte
a estados `focus-visible`, `active`, y `disabled` accesibles.

---

## 📥 Datos de Entrada

```ts
interface ComponentInput {
  // Nombre del componente (e.g. "EventCard", "RegistrationButton")
  componentName: string;

  // Variante semántica del componente
  variant: "primary" | "secondary" | "ghost" | "danger" | "success";

  // Paleta de colores del proyecto (tokens Tailwind extendidos)
  colorTokens: {
    brand:   string; // e.g. "violet-600"
    surface: string; // e.g. "zinc-900"
    accent:  string; // e.g. "fuchsia-500"
    text:    string; // e.g. "zinc-100"
    muted:   string; // e.g. "zinc-400"
    error:   string; // e.g. "rose-500"
  };

  // Esquema de datos que el componente debe representar
  dataSchema: Record<string, string>; // { field: "TypeScript type" }

  // ¿Requiere interacción del usuario? (formulario, botón, toggle)
  interactive: boolean;

  // Renderizado: Server Component (SC) o Client Component (CC)
  renderMode: "server" | "client";
}
```

---

## 📐 Reglas de Estilo Inmutables

### 1. Mobile-First Breakpoints
```
base  → 320px  (diseño para el teléfono más pequeño)
sm    → 640px
md    → 768px
lg    → 1024px
xl    → 1280px
```
> ⛔ **PROHIBIDO**: añadir estilos base que causen scroll horizontal. 
> Toda clase de ancho debe ser `w-full` o `max-w-*` con `mx-auto` a nivel contenedor.

### 2. Touch Targets (Accesibilidad Táctil)
- Botones e inputs: `min-h-[44px] min-w-[44px]`
- Usar `p-3` mínimo en elementos interactivos para ampliar área de toque
- Elementos de lista: `py-4` mínimo

### 3. Estados de Interacción (Immutable)
```
focus  → focus-visible:ring-2 focus-visible:ring-[brand] focus-visible:outline-none
active → active:scale-[0.97] active:brightness-90 transition-transform
hover  → hover:bg-[surface-hover] transition-colors duration-150
disabled → disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
```

### 4. Tipografía Responsiva
```
Título evento:    text-xl sm:text-2xl font-bold tracking-tight
Subtítulo:        text-sm sm:text-base font-medium text-muted
Body / desc:      text-sm leading-relaxed text-zinc-300
Labels input:     text-xs font-semibold uppercase tracking-wider text-zinc-400
```

### 5. Espaciado del Sistema
```
Padding interno card:  p-4 sm:p-6
Gap entre secciones:   space-y-4 sm:space-y-6
Márgenes laterales:    px-4 sm:px-6 lg:px-8
```

---

## 📤 Formato de Salida

### Estructura de archivo
```
components/
  [ComponentName]/
    index.tsx       ← Componente principal
    types.ts        ← Interfaces TypeScript
    variants.ts     ← Definición de variantes con clases Tailwind
```

### Template Base — Client Component
```tsx
// components/[ComponentName]/index.tsx
"use client";

import { type FC } from "react";
import { cn } from "@/lib/utils"; // clsx + tailwind-merge
import type { [ComponentName]Props } from "./types";
import { variants } from "./variants";

export const [ComponentName]: FC<[ComponentName]Props> = ({
  variant = "primary",
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        // Base — mobile-first
        "relative w-full rounded-2xl overflow-hidden",
        // Surface
        "bg-zinc-900 border border-zinc-800",
        // Espaciado táctil
        "p-4 sm:p-6",
        // Variante
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

### Template Base — Server Component
```tsx
// components/[ComponentName]/index.tsx
import { cn } from "@/lib/utils";
import type { [ComponentName]Props } from "./types";

export function [ComponentName]({ className, data }: [ComponentName]Props) {
  return (
    <article className={cn("w-full p-4 sm:p-6 rounded-2xl bg-zinc-900", className)}>
      {/* Renderizado de datos del servidor */}
    </article>
  );
}
```

### Template de Variantes
```ts
// components/[ComponentName]/variants.ts
export const variants = {
  primary:   "bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700",
  secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-900",
  ghost:     "bg-transparent border border-zinc-700 text-zinc-300 hover:border-violet-500",
  danger:    "bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700",
  success:   "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700",
} as const;
```

---

## ✅ Checklist de Validación

Antes de entregar cualquier componente, verificar:

- [ ] Sin clases que generen overflow horizontal en 320px
- [ ] Áreas táctiles >= 44px en todos los elementos interactivos
- [ ] Estados `focus-visible`, `active`, `disabled` implementados
- [ ] Paleta de colores usa únicamente `colorTokens` del input
- [ ] El componente es `"use client"` solo si usa hooks/eventos
- [ ] Prop `className` acepta overrides (patrón `cn()`)
- [ ] Sin estilos inline — 100% Tailwind classes
