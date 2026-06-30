// src/modules/registration/utils/confirmation-code.ts
// =========================================================
// Generador de códigos de confirmación únicos para registros.
// Formato: CI-XXXXXXXX (prefijo "CI" + 8 caracteres alfanuméricos)
// =========================================================

/** Caracteres permitidos — excluye caracteres ambiguos (0/O, 1/I/l) */
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Longitud de la parte aleatoria del código */
const CODE_LENGTH = 8;

/** Prefijo identificador del proyecto CI Informática */
const CODE_PREFIX = "CI";

/**
 * Genera un código de confirmación único para una inscripción.
 *
 * Formato: `CI-XXXXXXXX`
 * - Prefijo `CI` identifica el proyecto (CI Informática)
 * - 8 caracteres alfanuméricos de un charset sin caracteres ambiguos
 *   (se excluyen: 0, O, 1, I, l para evitar confusión al leerlos)
 *
 * @returns Código de confirmación en formato `CI-XXXXXXXX`
 *
 * @example
 * const code = generateConfirmationCode();
 * // → "CI-A3F9K2MN"
 */
export function generateConfirmationCode(): string {
  const randomPart = Array.from({ length: CODE_LENGTH }, () =>
    CHARSET.charAt(Math.floor(Math.random() * CHARSET.length))
  ).join("");

  return `${CODE_PREFIX}-${randomPart}`;
}
