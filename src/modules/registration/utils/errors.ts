// src/modules/registration/utils/errors.ts
// =========================================================
// Sistema de errores tipados para el módulo de registro.
// Permite distinguir errores de negocio de errores del sistema.
// =========================================================

/**
 * Códigos de error específicos del módulo de registro.
 * Cada código representa un caso de negocio conocido y controlable.
 */
export type RegistrationErrorCode =
  | "DUPLICATE_REGISTRATION" // El participante ya está inscrito en el evento
  | "EVENT_FULL"             // El evento alcanzó su cupo máximo
  | "EVENT_NOT_FOUND"        // El evento no existe en la BD
  | "CATEGORY_NOT_FOUND"     // La categoría/tag no existe
  | "REGISTRATION_CLOSED"    // El registro está cerrado (inactivo o fecha límite pasada)
  | "TEAM_NOT_FOUND"         // El equipo especificado no existe
  | "TEAM_FULL"              // El equipo alcanzó su capacidad máxima de integrantes
  | "DB_TRANSACTION_FAILED"; // Fallo inesperado en la transacción de BD

/**
 * Error de negocio tipado del módulo de registro.
 *
 * Se lanza desde los services cuando se detecta una condición
 * de negocio conocida. La Server Action lo captura y retorna
 * un mensaje seguro al cliente.
 *
 * @example
 * throw new RegistrationError(
 *   "El evento ya alcanzó su capacidad máxima.",
 *   "EVENT_FULL"
 * );
 */
export class RegistrationError extends Error {
  constructor(
    message: string,
    public readonly code: RegistrationErrorCode,
    public readonly httpStatus: number = 400
  ) {
    super(message);
    this.name = "RegistrationError";
    // Necesario para instanceof en versiones transpiladas de ES5
    Object.setPrototypeOf(this, RegistrationError.prototype);
  }
}

/**
 * Type guard que determina si un error desconocido es un `RegistrationError`.
 *
 * Permite al catch block de la Server Action distinguir errores de negocio
 * (que tienen mensajes seguros para el cliente) de errores del sistema
 * (que deben loguearse internamente y retornar mensajes genéricos).
 *
 * @param err - Error capturado en un bloque catch (tipo `unknown`)
 * @returns `true` si el error es una instancia de `RegistrationError`
 *
 * @example
 * } catch (error) {
 *   if (isRegistrationError(error)) {
 *     return { success: false, error: error.message }; // Seguro para el cliente
 *   }
 *   return { success: false, error: "Error interno." }; // Mensaje genérico
 * }
 */
export function isRegistrationError(err: unknown): err is RegistrationError {
  return err instanceof RegistrationError;
}
