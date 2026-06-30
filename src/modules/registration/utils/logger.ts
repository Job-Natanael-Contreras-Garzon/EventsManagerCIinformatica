// src/modules/registration/utils/logger.ts
// =========================================================
// Logger estructurado del módulo de registro.
// En producción: preparado para integrar con Sentry/Datadog.
// En desarrollo: salida formateada en consola.
// =========================================================

/**
 * Logger estructurado del módulo de registro.
 *
 * Reglas de uso:
 * - `info()`: eventos normales de flujo (validaciones fallidas, errores de negocio conocidos)
 * - `error()`: errores inesperados del sistema que requieren atención
 *
 * NUNCA usar `console.log` directamente en el módulo; usar este logger.
 *
 * @example
 * registrationLogger.info("Registro exitoso", { confirmationCode: "CI-A3F9K2" });
 * registrationLogger.error("Error en transacción", err, { eventId: "uuid" });
 */
export const registrationLogger = {
  /**
   * Registra un evento informativo del flujo de negocio.
   *
   * @param message - Descripción del evento
   * @param context - Datos adicionales de contexto (sin datos sensibles)
   */
  info: (message: string, context?: Record<string, unknown>): void => {
    if (process.env.NODE_ENV === "development") {
      console.info(`[Registration] ℹ️  ${message}`, context ?? "");
    }
    // TODO: Integrar con servicio de observabilidad (ej. Sentry breadcrumb)
  },

  /**
   * Registra un error inesperado del sistema.
   * Siempre se ejecuta en todos los entornos.
   *
   * @param message - Descripción del error
   * @param error - El objeto de error capturado
   * @param context - Datos adicionales de contexto para el diagnóstico
   */
  error: (
    message: string,
    error: unknown,
    context?: Record<string, unknown>
  ): void => {
    console.error(`[Registration] ❌ ERROR: ${message}`, { error, ...context });
    // TODO: Enviar a Sentry o servicio de alertas en producción
  },
};
