---
name: Team_Code_Logic
description: >
  Estándares de calidad, convenciones de código y separación de responsabilidades
  para equipos que trabajan en `src/modules/`. El agente aplica este skill para
  garantizar que el código generado sea legible, mantenible, revisable en PRs,
  y coherente con los patrones del equipo: naming conventions, comentarios JSDoc,
  gestión de errores tipada, y prohibición de anti-patrones.
---

# Team_Code_Logic

## Contexto del Sistema

Este skill define las reglas de calidad que rigen **todo** el código generado
en el proyecto, con énfasis en `src/modules/registration`. Es el contrato de
equipo que garantiza que cualquier desarrollador (o agente) pueda leer, entender
y extender el código sin fricciones.

---

## Precondiciones

1. ESLint con `eslint-config-next` configurado.
2. Prettier configurado con las reglas del equipo.
3. TypeScript strict mode activo.
4. Convención de commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.).
5. El agente conoce la estructura de directorios definida en `NextJS_AppRouter_Expertise`.

---

## Algoritmo de Desarrollo

### Principio 1 – Separación de Responsabilidades (SRP)

Cada archivo tiene **una única responsabilidad**. El agente NUNCA escribe:

```typescript
// ❌ ANTI-PATRÓN: Lógica de negocio + query DB + validación en un mismo archivo
export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email.includes("@")) throw new Error("Invalid");       // validación ad-hoc
  const user = await prisma.participant.create({ data: { email } }); // DB directo
  await sendEmail(user.email);                                // side-effect acoplado
  return user;
}

// ✅ CORRECTO: Cada capa tiene su archivo
// actions/registration.action.ts  → orquesta, no implementa
// services/registration.service.ts → lógica de negocio
// services/email.service.ts        → side-effects aislados
// schemas/registration.schema.ts   → validación
```

### Principio 2 – Nomenclatura estricta

| Tipo                  | Convención           | Ejemplo                          |
|-----------------------|----------------------|----------------------------------|
| Componentes React     | PascalCase           | `RegistrationForm.tsx`           |
| Server Actions        | camelCase + sufijo   | `registration.action.ts`         |
| Services              | camelCase + sufijo   | `registration.service.ts`        |
| Schemas Zod           | camelCase + sufijo   | `registration.schema.ts`         |
| Tipos/Interfaces      | PascalCase + sufijo  | `RegistrationInput`, `EventDTO`  |
| Constantes de módulo  | UPPER_SNAKE_CASE     | `MAX_PARTICIPANTS_PER_EVENT`     |
| Hooks personalizados  | use + PascalCase     | `useRegistrationStatus`          |

### Principio 3 – Comentarios JSDoc obligatorios en exports públicos

```typescript
/**
 * Registra un nuevo participante en el evento especificado.
 *
 * @param input - Datos validados del formulario (ya pasaron Zod safeParse).
 * @returns Código de confirmación único o error tipado.
 * @throws {RegistrationError} Si el participante ya existe en el evento.
 *
 * @example
 * const result = await registerParticipant({ email: "a@b.com", eventId: "uuid" });
 * if (result.success) console.log(result.data.confirmationCode);
 */
export async function registerParticipant(
  input: RegistrationInput
): Promise<ActionResult<RegistrationResponse>> {
  // ...
}
```

### Principio 4 – Gestión de errores tipada (NO `any`)

```typescript
// src/modules/registration/utils/errors.ts

/** Errores específicos del módulo de registro */
export class RegistrationError extends Error {
  constructor(
    message: string,
    public readonly code: RegistrationErrorCode,
    public readonly httpStatus: number = 400
  ) {
    super(message);
    this.name = "RegistrationError";
  }
}

export type RegistrationErrorCode =
  | "DUPLICATE_REGISTRATION"
  | "EVENT_FULL"
  | "EVENT_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "REGISTRATION_CLOSED"
  | "DB_TRANSACTION_FAILED";

/** Type guard para distinguir errores de negocio de errores de sistema */
export function isRegistrationError(err: unknown): err is RegistrationError {
  return err instanceof RegistrationError;
}
```

### Principio 5 – Prohibición de `any` y `as` sin justificación

```typescript
// ❌ PROHIBIDO
const data = formData.get("email") as any;
const result = someFunction() as unknown as MyType;

// ✅ CORRECTO: Validar el tipo antes de usarlo
const rawEmail = formData.get("email");
if (typeof rawEmail !== "string") {
  return { success: false, error: "Campo email requerido." };
}
```

### Principio 6 – Logging estructurado (no `console.log` en producción)

```typescript
// src/modules/registration/utils/logger.ts
/**
 * Logger del módulo de registro.
 * En producción, envía a servicio de observabilidad.
 * En desarrollo, usa console con formato estructurado.
 */
export const registrationLogger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.info(`[Registration] ${message}`, context ?? "");
    }
    // TODO: Integrar con servicio de logs (e.g., Sentry, Datadog)
  },
  error: (message: string, error: unknown, context?: Record<string, unknown>) => {
    console.error(`[Registration] ERROR: ${message}`, { error, ...context });
    // TODO: Enviar a servicio de alertas
  },
};
```

### Principio 7 – Barrel exports por módulo

```typescript
// src/modules/registration/index.ts
// Exportar solo la API pública del módulo
// Los internos (services, utils, schemas) no se exportan a otros módulos
export type { RegistrationInput, RegistrationResponse } from "./schemas/registration.schema";
export type { ActionResult } from "./types/action-result.types";
// Los Server Actions se importan directamente desde su archivo
// Los componentes se importan directamente desde components/
```

---

## Postcondiciones

- ✅ Cada export público tiene JSDoc con `@param`, `@returns` y `@example`.
- ✅ Cero usos de `any` sin comentario `// eslint-disable-line` + justificación.
- ✅ Los errores son instancias de clases tipadas, nunca strings crudos.
- ✅ El código pasa ESLint y Prettier sin warnings.
- ✅ Cada archivo tiene una única responsabilidad (≤ 150 líneas como guía).
- ✅ No existe `console.log` en código de producción.
