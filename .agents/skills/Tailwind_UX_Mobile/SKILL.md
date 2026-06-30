---
name: Tailwind_UX_Mobile
description: >
  Diseña flujos UX móviles completos para la app de registro a eventos:
  formularios step-by-step, bottom sheets, modales táctiles, estados de carga
  skeleton y microinteracciones con Tailwind CSS. Prioriza la experiencia
  con una sola mano y gestos naturales de iOS/Android.
---

# Tailwind_UX_Mobile

## 🎯 Objetivo de la Habilidad

Crear **flujos de experiencia de usuario óptimos para móvil** en la app de
registro a eventos. Especifica y genera componentes para los patrones UX
más críticos: formularios multi-paso, feedback de estado, navegación táctil
y microinteracciones que comunican progreso y éxito al usuario.

---

## 📥 Datos de Entrada

```ts
interface MobileUXInput {
  // Flujo de usuario a diseñar
  userFlow: 
    | "event-discovery"      // Explorar y buscar eventos
    | "event-registration"   // Registrarse a un evento (multi-step)
    | "ticket-confirmation"  // Confirmación y QR de entrada
    | "profile-setup"        // Configuración de perfil inicial
    | "event-schedule";      // Vista de agenda del evento

  // Número de pasos si el flujo es multi-step
  stepCount?: number;

  // Campos del formulario (para flujos de registro)
  formFields?: {
    name: string;
    type: "text" | "email" | "tel" | "select" | "checkbox" | "radio" | "textarea";
    required: boolean;
    label: string;
    placeholder?: string;
  }[];

  // Paleta de colores activa
  colorTokens: {
    brand: string;
    success: string;
    error: string;
    surface: string;
  };
}
```

---

## 📐 Reglas de Estilo Inmutables

### 1. Inputs y Formularios Táctiles

```tsx
// ✅ Input táctil estándar
<input
  className="
    w-full min-h-[44px] px-4 py-3
    bg-zinc-800 border border-zinc-700 rounded-xl
    text-zinc-100 text-base          // text-base previene zoom en iOS
    placeholder:text-zinc-500
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-violet-500
    focus-visible:border-transparent
    transition-all duration-150
    disabled:opacity-40 disabled:cursor-not-allowed
  "
/>

// ✅ Label asociado (siempre visible, no placeholder-as-label)
<label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 block">
  Nombre completo <span className="text-rose-500">*</span>
</label>
```

> ⛔ **CRÍTICO**: `font-size` en inputs NUNCA menor a 16px (`text-base`) en iOS.
> Un font-size menor activa el auto-zoom del navegador Safari.

### 2. Bottom Sheet (Patrón Nativo Móvil)

```tsx
// Estado del drawer (open/closed)
const drawerVariants = {
  closed: "translate-y-full",
  open:   "translate-y-0",
};

// Estructura HTML
<div className="fixed inset-0 z-50 flex flex-col justify-end">
  {/* Overlay */}
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

  {/* Sheet */}
  <div className="
    relative z-10
    w-full max-h-[90dvh]
    bg-zinc-900 rounded-t-3xl
    overflow-y-auto overscroll-contain
    transition-transform duration-300 ease-out
    pb-safe                           // safe-area-inset-bottom
  ">
    {/* Handle */}
    <div className="flex justify-center pt-3 pb-2">
      <div className="w-10 h-1 bg-zinc-600 rounded-full" />
    </div>
    {/* Contenido */}
    <div className="px-4 pb-8">{children}</div>
  </div>
</div>
```

### 3. Stepper de Registro Multi-Paso

```tsx
// Indicador de progreso
<div className="flex items-center gap-2 px-4 py-3">
  {steps.map((step, i) => (
    <div key={i} className="flex items-center gap-2 flex-1">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
        "transition-all duration-300",
        i < currentStep  && "bg-violet-600 text-white",
        i === currentStep && "bg-violet-600 text-white ring-4 ring-violet-600/30",
        i > currentStep  && "bg-zinc-800 text-zinc-500",
      )}>
        {i < currentStep ? "✓" : i + 1}
      </div>
      {i < steps.length - 1 && (
        <div className={cn(
          "flex-1 h-0.5 rounded-full transition-all duration-500",
          i < currentStep ? "bg-violet-600" : "bg-zinc-800"
        )} />
      )}
    </div>
  ))}
</div>
```

### 4. Skeleton Loading (Mobile-First)

```tsx
// Skeleton de EventCard
<div className="w-full p-4 rounded-2xl bg-zinc-900 animate-pulse space-y-3">
  <div className="w-full h-40 rounded-xl bg-zinc-800" />        {/* imagen */}
  <div className="h-3 w-3/4 rounded-full bg-zinc-800" />       {/* título */}
  <div className="h-3 w-1/2 rounded-full bg-zinc-800" />       {/* subtítulo */}
  <div className="flex gap-2">
    <div className="h-7 w-20 rounded-full bg-zinc-800" />      {/* badge */}
    <div className="h-7 w-16 rounded-full bg-zinc-800" />      {/* badge */}
  </div>
</div>
```

### 5. Estados de Feedback (Toast / Alert)

```tsx
// Toast táctil (aparece desde abajo, encima de bottom nav)
<div className={cn(
  "fixed bottom-20 left-4 right-4 z-50",
  "flex items-center gap-3 px-4 py-3",
  "rounded-2xl shadow-2xl",
  "transition-all duration-300",
  type === "success" && "bg-emerald-950 border border-emerald-800 text-emerald-300",
  type === "error"   && "bg-rose-950 border border-rose-800 text-rose-300",
  type === "info"    && "bg-violet-950 border border-violet-800 text-violet-300",
)}>
  <span className="text-xl">{icon}</span>
  <p className="text-sm font-medium flex-1">{message}</p>
</div>
```

### 6. Botón CTA Primario Flotante

```tsx
<div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3 bg-gradient-to-t from-zinc-950 to-transparent">
  <button className="
    w-full min-h-[52px]
    bg-violet-600 hover:bg-violet-500
    active:scale-[0.98] active:bg-violet-700
    text-white font-semibold text-base
    rounded-2xl
    shadow-lg shadow-violet-900/50
    transition-all duration-150
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
    disabled:opacity-50 disabled:cursor-not-allowed
  ">
    Completar registro
  </button>
</div>
```

---

## 📤 Formato de Salida

El agente debe entregar los siguientes artefactos:

1. **Flujo completo en TSX** — Archivo de página `page.tsx` con todos los pasos
2. **Componentes extraídos** — Cada patrón UX como componente reutilizable
3. **Estado de UI** — Hook `useFormStep` o similar para manejar el flujo
4. **Microinteracciones** — Clases Tailwind de transición en cada estado

### Estructura de archivos de salida
```
app/(events)/register/
  page.tsx               ← Orquestador del flujo multi-paso
  _components/
    StepIndicator.tsx    ← Barra de progreso
    PersonalInfoStep.tsx ← Paso 1: datos personales
    EventSelectionStep.tsx ← Paso 2: elección de evento
    ConfirmationStep.tsx ← Paso 3: confirmación
    SuccessScreen.tsx    ← Pantalla de éxito + QR
  _hooks/
    useRegistrationFlow.ts ← Estado y validación del flujo
```

---

## ✅ Checklist UX Móvil

- [ ] `font-size` en inputs = 16px mínimo (evitar zoom iOS)
- [ ] Áreas táctiles ≥ 44×44px en todos los controles
- [ ] Bottom sheet usa `max-h-[90dvh]` y `overscroll-contain`
- [ ] Stepper visible en 320px sin overflow
- [ ] Skeleton aparece en el mismo espacio que el contenido real
- [ ] Toast no bloquea la bottom nav (positioned `bottom-20`)
- [ ] CTA flotante tiene gradient para no cortar contenido
- [ ] Transiciones ≤ 300ms para no parecer lentas
- [ ] Estados vacíos (empty states) diseñados para cada sección
- [ ] Flujo funciona en una sola mano (controles en zona alcanzable)
