---
name: Prisma_Query_Optimization
description: >
  Uso experto de Prisma Client en el módulo `src/modules/registration`.
  El agente aplica este skill para escribir queries optimizadas, manejar
  transacciones ACID con `$transaction`, prevenir N+1 queries, aislar el
  cliente de Prisma en un singleton seguro, y garantizar que DATABASE_URL
  nunca se exponga fuera de la capa de infraestructura (`src/lib/`).
---

# Prisma_Query_Optimization

## Contexto del Sistema

Prisma Client es el ORM oficial del proyecto para PostgreSQL. Este skill
define cómo el agente interactúa con la base de datos de forma segura,
eficiente y transaccional. La instancia de Prisma es un singleton que reside
en `src/lib/prisma.ts` y **nunca** se importa en archivos `"use client"`,
schemas, ni Server Actions directamente (solo en services).

---

## Precondiciones

1. `@prisma/client` instalado y `prisma generate` ejecutado.
2. `DATABASE_URL` definida en `.env.local` (excluida de `.gitignore`).
3. El singleton de Prisma existe en `src/lib/prisma.ts`.
4. Los services (`src/modules/registration/services/`) son los **únicos**
   consumidores del cliente Prisma. Actions y Components no lo importan.
5. El schema de Prisma está en `prisma/schema.prisma` con los modelos
   `Participant`, `Event`, `Category`, `Registration` definidos.

---

## Algoritmo de Desarrollo

### Paso 1 – Singleton de Prisma Client (infraestructura)

```typescript
// src/lib/prisma.ts
// ⚠️ ESTE ARCHIVO ES SERVER-ONLY. Nunca importar desde "use client".
import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient para prevenir múltiples conexiones
 * en entornos de desarrollo con Hot Module Replacement (HMR).
 *
 * En producción: una sola instancia por proceso de Node.js.
 * En desarrollo: reutiliza la instancia global entre recargas de módulo.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// DATABASE_URL es leída automáticamente por PrismaClient desde process.env.
// NUNCA pasar DATABASE_URL como argumento explícito.
// NUNCA exportar process.env.DATABASE_URL.
```

### Paso 2 – Service con transacción ACID

```typescript
// src/modules/registration/services/registration.service.ts
import "server-only";
import { prisma } from "@/lib/prisma";
import {
  RegistrationError,
  type RegistrationErrorCode,
} from "@/modules/registration/utils/errors";
import type {
  RegistrationInput,
  RegistrationResponse,
} from "@/modules/registration/schemas/registration.schema";
import { generateConfirmationCode } from "@/modules/registration/utils/confirmation-code";

/**
 * Registra un participante en la base de datos usando una transacción ACID.
 *
 * La transacción garantiza que:
 * - La verificación de duplicados y la creación del registro son atómicas.
 * - El contador de participantes se actualiza consistentemente.
 * - Si cualquier operación falla, se hace rollback completo.
 *
 * @param input - Datos validados por Zod (se confía en su integridad).
 * @throws {RegistrationError} Para errores de negocio conocidos.
 * @throws Error Para errores inesperados del sistema (la acción los captura).
 */
export async function registerParticipant(
  input: RegistrationInput
): Promise<RegistrationResponse> {
  // ── Verificaciones previas a la transacción (lecturas baratas) ──────────
  const [event, category] = await Promise.all([
    prisma.event.findUnique({
      where: { id: input.eventId },
      select: {
        id: true,
        name: true,
        isActive: true,
        registrationDeadline: true,
        maxParticipants: true,
        _count: { select: { registrations: true } },
      },
    }),
    prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true, name: true },
    }),
  ]);

  // Validaciones de negocio (antes de iniciar la transacción)
  if (!event) {
    throw new RegistrationError("Evento no encontrado.", "EVENT_NOT_FOUND", 404);
  }
  if (!event.isActive) {
    throw new RegistrationError(
      "El registro para este evento está cerrado.",
      "REGISTRATION_CLOSED"
    );
  }
  if (event.registrationDeadline && event.registrationDeadline < new Date()) {
    throw new RegistrationError(
      "La fecha límite de registro ha pasado.",
      "REGISTRATION_CLOSED"
    );
  }
  if (
    event.maxParticipants !== null &&
    event._count.registrations >= event.maxParticipants
  ) {
    throw new RegistrationError(
      "Este evento ya alcanzó su capacidad máxima.",
      "EVENT_FULL"
    );
  }
  if (!category) {
    throw new RegistrationError(
      "Categoría no encontrada.",
      "CATEGORY_NOT_FOUND",
      404
    );
  }

  // ── Transacción ACID ────────────────────────────────────────────────────
  const registration = await prisma.$transaction(async (tx) => {
    // Paso A: Verificar si ya existe un registro (dentro de la tx para atomicidad)
    const existingRegistration = await tx.registration.findFirst({
      where: {
        participant: { email: input.email },
        eventId: input.eventId,
      },
      select: { id: true },
    });

    if (existingRegistration) {
      throw new RegistrationError(
        "Este correo ya está registrado para el evento.",
        "DUPLICATE_REGISTRATION"
      );
    }

    // Paso B: Upsert del participante (crear si no existe, actualizar si existe)
    const participant = await tx.participant.upsert({
      where: { email: input.email },
      create: {
        email: input.email,
        fullName: input.fullName,
        documentId: input.documentId,
        phone: input.phone ?? null,
      },
      update: {
        // Actualizar datos del participante si ya existe
        fullName: input.fullName,
        documentId: input.documentId,
        phone: input.phone ?? null,
      },
      select: { id: true, fullName: true },
    });

    // Paso C: Crear el registro de inscripción
    const newRegistration = await tx.registration.create({
      data: {
        participantId: participant.id,
        eventId: input.eventId,
        categoryId: input.categoryId,
        confirmationCode: generateConfirmationCode(),
        status: "PENDING",
      },
      select: {
        confirmationCode: true,
        createdAt: true,
      },
    });

    return {
      confirmationCode: newRegistration.confirmationCode,
      participantName: participant.fullName,
      createdAt: newRegistration.createdAt,
    };
  });

  // ── Mapeo a DTO de respuesta (nunca retornar objetos Prisma crudos) ─────
  return {
    confirmationCode: registration.confirmationCode,
    participantName: registration.participantName,
    eventName: event.name,
    registeredAt: registration.createdAt.toISOString(),
  };
}
```

### Paso 3 – Prevención de N+1 queries

```typescript
// ❌ ANTI-PATRÓN: N+1 query (una query por cada registro)
const registrations = await prisma.registration.findMany();
for (const reg of registrations) {
  const participant = await prisma.participant.findUnique({
    where: { id: reg.participantId },
  });
}

// ✅ CORRECTO: Una sola query con include/select anidado
const registrations = await prisma.registration.findMany({
  where: { eventId: input.eventId },
  select: {
    id: true,
    confirmationCode: true,
    status: true,
    participant: {
      select: {
        fullName: true,
        email: true,
      },
    },
    category: {
      select: { name: true },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

### Paso 4 – Select explícito (nunca `findMany()` sin select)

```typescript
// ❌ PROHIBIDO: Seleccionar todos los campos (incluye datos sensibles y pesados)
const participant = await prisma.participant.findUnique({
  where: { id },
  // Sin select → retorna TODOS los campos, incluidos hashes de contraseña, etc.
});

// ✅ OBLIGATORIO: Select explícito de solo los campos necesarios
const participant = await prisma.participant.findUnique({
  where: { id },
  select: {
    id: true,
    fullName: true,
    email: true,
    // ❌ NO incluir: passwordHash, internalNotes, createdAt (si no se necesita)
  },
});
```

### Paso 5 – Configuración de timeout en transacciones

```typescript
// Para transacciones que pueden tardar (e.g., operaciones batch)
const result = await prisma.$transaction(
  async (tx) => {
    // ... operaciones ...
  },
  {
    maxWait: 5000,  // Tiempo máximo de espera para adquirir la transacción (ms)
    timeout: 10000, // Tiempo máximo de ejecución de la transacción (ms)
    isolationLevel: "Serializable", // Para operaciones críticas de concurrencia
  }
);
```

---

## Postcondiciones

- ✅ `prisma` nunca se importa fuera de `src/lib/prisma.ts` y los services en `src/modules/*/services/`.
- ✅ `DATABASE_URL` nunca aparece como string en ningún archivo fuente.
- ✅ Todas las operaciones de escritura múltiple usan `$transaction`.
- ✅ Todos los queries usan `select` explícito; nunca se retornan todos los campos.
- ✅ No existen queries N+1; se usan `include`/`select` anidados o `Promise.all`.
- ✅ Los objetos Prisma nunca cruzan el boundary servidor→cliente; se mapean a DTOs.
- ✅ El singleton de Prisma tiene `import "server-only"` para protección en build time.
