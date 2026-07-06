"use server";

import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/utils/session";
import type { ActionResult } from "@/modules/registration/types/action-result.types";

interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Server Action: Registra o actualiza una suscripción push para el usuario logueado.
 */
export async function subscribePushAction(rawInput: PushSubscriptionInput): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Debes iniciar sesión para activar las notificaciones.",
      };
    }

    const { endpoint, keys } = rawInput;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return {
        success: false,
        error: "Datos de suscripción push inválidos.",
      };
    }

    // Guardar o actualizar la suscripción push
    // Usamos un upsert basado en el endpoint que es único
    await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: currentUser.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        userId: currentUser.userId, // Por si cambia el usuario en el navegador
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    console.log(`[Push Action] Suscripción registrada con éxito para el usuario ${currentUser.name} (ID: ${currentUser.userId})`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("[Push Action] Error al suscribir a notificaciones push:", error);
    return {
      success: false,
      error: "Ocurrió un error interno al procesar la suscripción.",
    };
  }
}

/**
 * Server Action: Elimina una suscripción push (cuando el usuario desactiva las notificaciones).
 */
export async function unsubscribePushAction(endpoint: string): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "No autorizado. Por favor inicia sesión.",
      };
    }

    if (!endpoint) {
      return {
        success: false,
        error: "Endpoint no proporcionado.",
      };
    }

    // Eliminar la suscripción si existe
    await db.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: currentUser.userId,
      },
    });

    console.log(`[Push Action] Suscripción eliminada para el usuario ${currentUser.name} (Endpoint: ${endpoint})`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("[Push Action] Error al eliminar suscripción push:", error);
    return {
      success: false,
      error: "Ocurrió un error interno al eliminar la suscripción.",
    };
  }
}
