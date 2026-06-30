---
name: Form_Validation_Zod
description: >
  Validación de formularios isomórfica usando Zod en la capa cliente y servidor.
  El agente aplica este skill cuando necesita definir schemas de validación,
  integrar react-hook-form con zodResolver, y re-validar datos en Server Actions
  antes de cualquier escritura en base de datos. Aplica al módulo
  `src/modules/registration/schemas/` y a todos sus consumidores.
---

# Form_Validation_Zod

## Contexto del Sistema

Zod actúa como la **fuente única de verdad** para las reglas de validación.
El mismo schema se usa en cliente (feedback inmediato al usuario) y en servidor
(guardia de seguridad antes de operar la DB). Esto elimina la duplicación de
lógica y previene ataques de manipulación de payloads.

---

## Precondiciones

1. `zod` ≥ 3.22 instalado como dependencia de producción.
2. `react-hook-form` + `@hookform/resolvers` instalados para la capa cliente.
3. Los schemas residen **únicamente** en `src/modules/registration/schemas/`.
4. Los schemas NO importan nada de `@prisma/client`, `server-only`, ni variables
   `process.env`. Son módulos isomórficos puros.
5. TypeScript strict mode habilitado (`"strict": true` en tsconfig.json).

---

## Algoritmo de Desarrollo

### Paso 1 – Definir el schema canónico

```typescript
// src/modules/registration/schemas/registration.schema.ts
import { z } from "zod";

/**
 * Schema canónico para el registro de participantes.
 * Este archivo NO tiene "use client" ni imports de servidor.
 * Es isomórfico: se ejecuta en cliente Y servidor.
 */
export const registrationSchema = z.object({
  // Datos personales
  fullName: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(100, "El nombre no puede superar 100 caracteres.")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios."),

  email: z
    .string()
    .email("Debe ser un correo electrónico válido.")
    .max(254, "El correo no puede superar 254 caracteres."),

  documentId: z
    .string()
    .min(6, "El documento debe tener al menos 6 caracteres.")
    .max(20, "El documento no puede superar 20 caracteres.")
    .regex(/^[0-9A-Z\-]+$/, "Formato de documento inválido."),

  phone: z
    .string()
    .regex(/^\+?[0-9\s\-]{7,15}$/, "Número de teléfono inválido.")
    .optional(),

  eventId: z
    .string()
    .uuid("El identificador del evento no es válido."),

  categoryId: z
    .string()
    .uuid("La categoría seleccionada no es válida."),

  acceptedTerms: z
    .literal(true, {
      errorMap: () => ({ message: "Debe aceptar los términos y condiciones." }),
    }),
});

/** Tipo inferido del schema – usar en toda la aplicación */
export type RegistrationInput = z.infer<typeof registrationSchema>;

/**
 * Schema de respuesta segura (sin datos sensibles).
 * Nunca exponer IDs internos de DB directamente al cliente.
 */
export const registrationResponseSchema = z.object({
  confirmationCode: z.string(),
  participantName: z.string(),
  eventName: z.string(),
  registeredAt: z.string().datetime(),
});

export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;
```

### Paso 2 – Integrar en el Client Component

```typescript
// src/modules/registration/components/RegistrationForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import {
  registrationSchema,
  type RegistrationInput,
} from "@/modules/registration/schemas/registration.schema";
import { submitRegistration } from "@/modules/registration/actions/registration.action";
import type { ActiveEvent } from "@/modules/registration/types/event.types";

interface RegistrationFormProps {
  events: ActiveEvent[];
}

export function RegistrationForm({ events }: RegistrationFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      acceptedTerms: true, // El checkbox debe estar marcado por defecto o manejarse
    },
  });

  const onSubmit = (data: RegistrationInput) => {
    startTransition(async () => {
      // 'data' ya pasó la validación Zod del cliente
      const result = await submitRegistration(data);

      if (!result.success) {
        // Mapear errores del servidor de vuelta al formulario
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof RegistrationInput, {
              message: messages?.[0],
            });
          });
        }
        return;
      }

      reset();
      // Navegar o mostrar confirmación
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="fullName">Nombre Completo</label>
        <input id="fullName" {...register("fullName")} />
        {errors.fullName && (
          <p role="alert" aria-live="polite">
            {errors.fullName.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email">Correo Electrónico</label>
        <input id="email" type="email" {...register("email")} />
        {errors.email && (
          <p role="alert" aria-live="polite">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Continuar con los demás campos... */}

      <button type="submit" disabled={isPending || isSubmitting}>
        {isPending ? "Registrando..." : "Completar Registro"}
      </button>
    </form>
  );
}
```

### Paso 3 – Re-validación obligatoria en el servidor

**REGLA CRÍTICA**: El servidor SIEMPRE re-valida con Zod, incluso si el cliente ya validó.
El cliente puede ser manipulado. La validación del servidor es la defensa real.

```typescript
// Patrón de re-validación en Server Action (ver skill NextJS_ServerActions)
const parsed = registrationSchema.safeParse(rawData);
if (!parsed.success) {
  return {
    success: false,
    fieldErrors: parsed.error.flatten().fieldErrors,
  };
}
// Solo usar parsed.data a partir de aquí
```

### Paso 4 – Tipos de retorno estandarizados

```typescript
// src/modules/registration/types/action-result.types.ts

/**
 * Tipo de retorno estándar para todas las Server Actions del módulo.
 * Garantiza consistencia en el manejo de errores del cliente.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };
```

---

## Postcondiciones

- ✅ Un solo schema por entidad en `schemas/` – cero duplicación de reglas.
- ✅ Los mensajes de error son descriptivos y en el idioma del proyecto (español).
- ✅ El servidor nunca confía en datos no validados; siempre usa `safeParse`.
- ✅ Los tipos TypeScript se infieren del schema (`z.infer<typeof schema>`),
     nunca se definen manualmente por separado.
- ✅ Los errores del servidor se mapean de vuelta a los campos del formulario.
- ✅ El schema no genera side-effects ni imports de módulos de servidor.
