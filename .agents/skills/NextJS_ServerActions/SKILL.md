---
name: NextJS_ServerActions
description: >
  Implementación segura de Next.js Server Actions en el módulo `src/modules/registration`.
  El agente aplica este skill para crear funciones `"use server"` que orquestan
  validación Zod, lógica de negocio y transacciones Prisma. Incluye protección CSRF
  implícita, aislamiento de credenciales, manejo de errores tipado, y el patrón
  exacto de retorno para comunicar resultados al cliente sin exponer detalles internos.
---

# NextJS_ServerActions

## Contexto del Sistema

Las Server Actions son el punto de entrada principal para mutaciones desde el
cliente hacia el servidor. Actúan como **orquestadores**: reciben datos crudos,
validan con Zod, delegan a services, y retornan un resultado estructurado.
Nunca contienen lógica de negocio directamente ni queries a la DB.

---

## Precondiciones

1. Next.js ≥ 14 con Server Actions habilitadas (por defecto en App Router).
2. El archivo de la acción está en `src/modules/registration/actions/`.
3. El archivo empieza con la directiva `"use server"` como primera línea.
4. La acción NO se llama desde otro Server Component directamente como función
   JS; se importa y pasa como `action` prop o se invoca desde un Client Component.
5. Las variables de entorno secretas (`DATABASE_URL`, `NEXTAUTH_SECRET`, etc.)
   **NUNCA** se leen dentro de este archivo; son responsabilidad de los services.
6. El tipo de retorno siempre es `Promise<ActionResult<T>>` (ver `Team_Code_Logic`).

---

## Algoritmo de Desarrollo

### Estructura canónica de una Server Action

```typescript
// src/modules/registration/actions/registration.action.ts
"use server";

// ✅ Solo imports de servidor: schemas, services, types, utils del módulo
import { registrationSchema } from "@/modules/registration/schemas/registration.schema";
import { registerParticipant } from "@/modules/registration/services/registration.service";
import { isRegistrationError } from "@/modules/registration/utils/errors";
import { registrationLogger } from "@/modules/registration/utils/logger";
import type {
  ActionResult,
} from "@/modules/registration/types/action-result.types";
import type {
  RegistrationInput,
  RegistrationResponse,
} from "@/modules/registration/schemas/registration.schema";

/**
 * Server Action: Procesa el envío del formulario de registro.
 *
 * Flujo:
 * 1. Re-valida con Zod (defensa del servidor, independiente del cliente).
 * 2. Delega la lógica al service.
 * 3. Retorna resultado estructurado (nunca lanza excepciones al cliente).
 *
 * @param rawInput - Datos crudos del formulario (tipados pero no confiables).
 * @returns Resultado con confirmación o errores de campo mapeados.
 */
export async function submitRegistration(
  rawInput: unknown
): Promise<ActionResult<RegistrationResponse>> {
  // ── Paso 1: Validación de entrada ──────────────────────────────────────
  const parsed = registrationSchema.safeParse(rawInput);

  if (!parsed.success) {
    registrationLogger.info("Validación fallida en submitRegistration", {
      errors: parsed.error.flatten().fieldErrors,
    });
    return {
      success: false,
      error: "Los datos del formulario son inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // A partir de aquí, usar SOLO `parsed.data` (datos garantizados como válidos)
  const validatedInput: RegistrationInput = parsed.data;

  // ── Paso 2: Delegar al service ─────────────────────────────────────────
  try {
    const response = await registerParticipant(validatedInput);
    return { success: true, data: response };
  } catch (error) {
    // ── Paso 3: Manejo de errores tipados ──────────────────────────────
    if (isRegistrationError(error)) {
      // Error de negocio conocido: informar al cliente de forma segura
      registrationLogger.info(`Error de negocio: ${error.code}`, {
        message: error.message,
      });
      return {
        success: false,
        error: error.message, // Mensaje ya es seguro para el cliente
        fieldErrors: mapErrorToField(error.code),
      };
    }

    // Error inesperado del sistema: NO exponer detalles al cliente
    registrationLogger.error(
      "Error inesperado en submitRegistration",
      error,
      { eventId: validatedInput.eventId }
    );

    return {
      success: false,
      error: "Ocurrió un error interno. Por favor intente más tarde.",
    };
  }
}

/**
 * Mapea códigos de error de negocio a campos específicos del formulario.
 * Permite que react-hook-form muestre el error en el campo correcto.
 */
function mapErrorToField(
  code: string
): Partial<Record<keyof RegistrationInput, string[]>> | undefined {
  const fieldMap: Partial<Record<string, Partial<Record<keyof RegistrationInput, string[]>>>> = {
    DUPLICATE_REGISTRATION: {
      email: ["Este correo ya está registrado para este evento."],
    },
    EVENT_NOT_FOUND: {
      eventId: ["El evento seleccionado no existe o fue eliminado."],
    },
    CATEGORY_NOT_FOUND: {
      categoryId: ["La categoría seleccionada no es válida."],
    },
    EVENT_FULL: {
      eventId: ["Este evento ya alcanzó su cupo máximo de participantes."],
    },
  };
  return fieldMap[code];
}
```

### Reglas de seguridad de Server Actions

#### ❌ PROHIBIDO en Server Actions

```typescript
"use server";

// ❌ Leer DB directamente (responsabilidad del service)
import { prisma } from "@/lib/prisma";
const user = await prisma.participant.findFirst({ where: { email } });

// ❌ Leer variables de entorno secretas (responsabilidad del service/lib)
const dbUrl = process.env.DATABASE_URL;

// ❌ Lanzar excepciones sin capturar (el cliente nunca debe ver stack traces)
throw new Error("DB connection failed: postgresql://user:pass@host:5432/db");

// ❌ Retornar objetos Prisma completos (expone estructura interna de la DB)
return { success: true, data: prismaParticipant }; // Tiene campos internos
```

#### ✅ OBLIGATORIO en Server Actions

```typescript
"use server";

// ✅ Siempre re-validar con Zod
const parsed = schema.safeParse(rawInput);

// ✅ Solo retornar DTOs tipados (ver schemas/registration.schema.ts)
return { success: true, data: registrationResponseSchema.parse(response) };

// ✅ Capturar TODOS los errores con try/catch
// ✅ Usar 'unknown' como tipo del error capturado
// ✅ Logs del servidor, mensajes genéricos al cliente en errores inesperados
```

### Patrón de revalidación de caché tras mutación

```typescript
"use server";

import { revalidatePath } from "next/cache";

export async function submitRegistration(rawInput: unknown) {
  // ... validación y service call ...

  if (result.success) {
    // Invalida la caché de la página de eventos para reflejar cambios
    revalidatePath("/events");
    revalidatePath(`/events/${validatedInput.eventId}`);
  }

  return result;
}
```

### Protección adicional con `server-only`

```typescript
// src/modules/registration/actions/registration.action.ts
"use server";
import "server-only"; // Garantiza que este módulo no se bundle en el cliente

// Si se importa accidentalmente en un Client Component,
// Next.js lanzará un error en build time (no en runtime).
```

---

## Postcondiciones

- ✅ Todo archivo de acción empieza con `"use server"` como primera línea.
- ✅ Todas las acciones reciben `rawInput: unknown` y validan con Zod antes de usar los datos.
- ✅ Ninguna acción lee `process.env` directamente ni importa `prisma`.
- ✅ Los errores inesperados retornan mensajes genéricos; los detalles solo van al log del servidor.
- ✅ Los objetos Prisma nunca se retornan directamente; siempre se mapean a DTOs.
- ✅ Las acciones exitosas llaman `revalidatePath` o `revalidateTag` cuando corresponde.
- ✅ El tipo de retorno es siempre `Promise<ActionResult<T>>`.
