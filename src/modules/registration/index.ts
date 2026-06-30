// src/modules/registration/index.ts
// =========================================================
// Barrel export — API pública del módulo de registro.
// Solo exponer lo que los demás módulos necesitan conocer.
// Los internals (services, utils) NO se re-exportan aquí;
// se importan directamente desde sus archivos cuando son necesarios.
// =========================================================

// ── Tipos públicos ──────────────────────────────────────────────────────────
export type {
  RegistrationInput,
  RegistrationResponse,
} from "./schema";

export type { ActionResult } from "./types/action-result.types";

export type {
  ActiveEvent,
  EncargadoDTO,
} from "./types/event.types";

// Nota: Los Server Actions se importan directamente desde su archivo:
// import { registerPlayer } from "@/modules/registration/actions";
