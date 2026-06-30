// src/modules/registration/types/action-result.types.ts
// =========================================================
// Tipo de retorno estándar para todas las Server Actions
// del módulo de registro.
// =========================================================

/**
 * Resultado tipado que retornan todas las Server Actions del módulo.
 *
 * Garantiza consistencia en el manejo de errores en el cliente.
 *
 * @example
 * // Éxito
 * const result: ActionResult<RegistrationResponse> = { success: true, data: { ... } };
 *
 * // Error con campos
 * const result: ActionResult = {
 *   success: false,
 *   error: "Los datos son inválidos.",
 *   fieldErrors: { email: ["El correo ya existe."] }
 * };
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };
