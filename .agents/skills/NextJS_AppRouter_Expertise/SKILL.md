---
name: NextJS_AppRouter_Expertise
description: >
  Dominio completo del App Router de Next.js 14+. El agente aplica esta habilidad
  cuando necesita crear o modificar rutas, layouts, Server Components, Client Components,
  o cualquier estructura de directorio dentro de `src/`. Incluye directrices para
  separación estricta server/client, gestión de metadata y colocation de módulos.
---

# NextJS_AppRouter_Expertise

## Contexto del Sistema

Este skill rige la arquitectura de enrutamiento y organización de archivos en
proyectos Next.js 14+ con App Router. Se aplica específicamente al módulo
`src/modules/registration` y a cualquier página o segmento de ruta relacionado.

---

## Precondiciones

Antes de escribir cualquier código bajo este skill, el agente DEBE verificar:

1. **Next.js ≥ 14** con `appDir: true` (o la configuración por defecto del App Router).
2. El directorio de destino sigue la convención:
   ```
   src/
   └── modules/
       └── registration/
           ├── actions/       # Server Actions exclusivamente
           ├── components/    # Client Components con "use client"
           ├── schemas/       # Schemas Zod compartidos (isomórficos, sin imports de servidor)
           ├── services/      # Lógica de negocio pura del lado servidor
           ├── types/         # TypeScript interfaces y DTOs
           └── utils/         # Helpers sin side-effects
   src/
   └── app/
       └── (registration)/
           └── register/
               ├── page.tsx   # Server Component (sin "use client")
               └── layout.tsx
   ```
3. No existe ningún import de módulos de servidor (`prisma`, `fs`, variables de proceso)
   dentro de archivos marcados con `"use client"`.

---

## Algoritmo de Desarrollo

### Paso 1 – Clasificar el componente

```
SI el componente necesita:
  - fetch de datos directo (DB, API interna)
  - acceso a headers/cookies del servidor
  - variables de entorno secretas
  → ES un Server Component (NO añadir "use client")

SI el componente necesita:
  - useState / useEffect / hooks de React
  - event handlers del DOM (onClick, onChange, etc.)
  - APIs del browser (window, localStorage)
  → ES un Client Component (SIEMPRE "use client" en la primera línea)
```

### Paso 2 – Nomenclatura y colocation

- Los Server Components usan sufijo `.tsx` sin directiva.
- Los Client Components usan sufijo `.client.tsx` O la directiva `"use client"` explícita.
- Los archivos de acción usan sufijo `.action.ts` y residen en `actions/`.
- Los schemas Zod residen en `schemas/` con sufijo `.schema.ts`.

### Paso 3 – Data fetching en Server Components

```typescript
// src/app/(registration)/register/page.tsx
// ✅ CORRECTO: Server Component sin "use client"

import { RegistrationForm } from "@/modules/registration/components/RegistrationForm";
import { getActiveEvents } from "@/modules/registration/services/event.service";

export const metadata = {
  title: "Registro de Participantes | CI Informática",
  description: "Formulario de inscripción al evento.",
};

export default async function RegisterPage() {
  // Data fetching directo: seguro porque es Server Component
  const events = await getActiveEvents();

  return (
    <main>
      <h1>Registro de Participantes</h1>
      {/* Serialización: solo datos planos se pasan como props */}
      <RegistrationForm events={events} />
    </main>
  );
}
```

### Paso 4 – Client Component con boundary explícito

```typescript
// src/modules/registration/components/RegistrationForm.tsx
"use client";

// ❌ NUNCA importar aquí: prisma, process.env secrets, fs, etc.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema } from "@/modules/registration/schemas/registration.schema";
import { submitRegistration } from "@/modules/registration/actions/registration.action";

export function RegistrationForm({ events }: { events: ActiveEvent[] }) {
  // Implementación del formulario – ver skill Form_Validation_Zod
}
```

### Paso 5 – Gestión de errores en la capa de ruta

```typescript
// src/app/(registration)/register/error.tsx
"use client";

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert">
      <p>Ocurrió un error en el registro. Por favor intente nuevamente.</p>
      <button onClick={reset}>Reintentar</button>
    </div>
  );
}
```

---

## Postcondiciones

Tras aplicar este skill, el agente garantiza:

- ✅ Cero imports de servidor en archivos `"use client"`.
- ✅ Cada página exporta `metadata` o `generateMetadata()`.
- ✅ Los boundary de error y loading están definidos por segmento.
- ✅ Los datos nunca se pasan como funciones entre Server y Client Components;
     solo datos serializables (JSON-safe).
- ✅ El directorio `src/modules/registration` es autocontenido y no genera
     dependencias circulares con otros módulos.

---

## Referencias

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering)
