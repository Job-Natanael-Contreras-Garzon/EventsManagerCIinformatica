// src/modules/registration/actions.ts
// =========================================================
// Server Actions: Orquestadora de mutaciones y peticiones.
// ⚠️ SERVER-ONLY: Punto de entrada desde el cliente.
// =========================================================
"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { registrationSchema } from "./schema";
import { registerParticipant } from "./services";
import { isRegistrationError } from "./utils/errors";
import { registrationLogger } from "./utils/logger";
import type { ActionResult } from "./types/action-result.types";
import type { RegistrationInput, RegistrationResponse } from "./schema";
import { notifyNewRegistration, notifyEventFull } from "@/modules/notifications/services/push.service";

/**
 * Server Action: Inscribe a un jugador/participante en un evento.
 * Soporta flujos individuales y grupales (crear equipo o unirse a uno existente).
 *
 * Flujo:
 * 1. Re-validación estricta con Zod en el servidor.
 * 2. Delegación al service de registro (transaccional).
 * 3. Revalidación de caché en Next.js para actualizar métricas de registro.
 * 4. Manejo seguro de errores sin exponer detalles internos al cliente.
 *
 * @param rawInput - Datos crudos del formulario (unknown).
 * @returns Resultado del registro estructurado con datos seguros o errores.
 */
export async function registerPlayer(
  rawInput: unknown
): Promise<ActionResult<RegistrationResponse>> {
  // ── Paso 1: Validación Zod en el Servidor ────────────────────────────────
  const parsed = registrationSchema.safeParse(rawInput);

  if (!parsed.success) {
    registrationLogger.info(
      "Validación fallida en registerPlayer (posible manipulación en el cliente)",
      { errors: parsed.error.flatten().fieldErrors }
    );
    return {
      success: false,
      error: "Los datos del formulario son inválidos. Por favor, revíselos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const validatedInput: RegistrationInput = parsed.data;

  // ── Paso 2: Delegar al service transaccional ─────────────────────────────
  try {
    const response = await registerParticipant(validatedInput);

    // ── Paso 3: Revalidación de Caché ───────────────────────────────────────
    revalidatePath("/");
    revalidatePath("/registro");
    revalidatePath(`/eventos/${validatedInput.eventId}`);

    registrationLogger.info("Inscripción realizada exitosamente", {
      confirmationCode: response.confirmationCode,
      eventId: validatedInput.eventId,
      registrationType: validatedInput.registrationType,
    });

    // Disparar notificaciones push en segundo plano
    notifyNewRegistration(response.confirmationCode).catch((err) =>
      console.error("[Registration Action] Error al enviar notificación de nuevo registro:", err)
    );
    notifyEventFull(validatedInput.eventId).catch((err) =>
      console.error("[Registration Action] Error al enviar notificación de evento lleno:", err)
    );

    return { success: true, data: response };
  } catch (error) {
    // ── Paso 4: Manejo de errores controlados ────────────────────────────────
    if (isRegistrationError(error)) {
      registrationLogger.info(`Error de negocio en registerPlayer: ${error.code}`, {
        message: error.message,
        eventId: validatedInput.eventId,
      });

      return {
        success: false,
        error: error.message,
        fieldErrors: mapErrorToField(error.code),
      };
    }

    // Error inesperado del sistema (no exponer credenciales ni base de datos)
    registrationLogger.error(
      "Error inesperado en registerPlayer",
      error,
      { eventId: validatedInput.eventId, registerCode: validatedInput.registerCode }
    );

    return {
      success: false,
      error: "Ocurrió un error interno en el servidor. Por favor intente más tarde.",
    };
  }
}

/**
 * Mapea códigos de error de negocio a campos específicos de entrada.
 * Esto permite al cliente resaltar el campo que causó el fallo.
 */
function mapErrorToField(
  code: string
): Partial<Record<keyof RegistrationInput, string[]>> | undefined {
  const fieldMap: Partial<
    Record<string, Partial<Record<keyof RegistrationInput, string[]>>>
  > = {
    DUPLICATE_REGISTRATION: {
      registerCode: ["Ya estás inscrito en este evento con este código universitario."],
    },
    EVENT_NOT_FOUND: {
      eventId: ["El evento seleccionado no existe o fue eliminado."],
    },
    EVENT_FULL: {
      eventId: ["Este evento ya alcanzó su cupo máximo de participantes."],
    },
    REGISTRATION_CLOSED: {
      eventId: ["El registro para este evento está cerrado o la fecha límite ha pasado."],
    },
    TEAM_NOT_FOUND: {
      teamCode: ["El equipo con el código proporcionado no existe en este evento."],
    },
    TEAM_FULL: {
      teamCode: ["El equipo seleccionado ya está completo (máximo 5 integrantes)."],
    },
  };
  return fieldMap[code];
}
