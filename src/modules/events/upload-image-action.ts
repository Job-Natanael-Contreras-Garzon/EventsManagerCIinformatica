// src/modules/events/upload-image-action.ts
// =========================================================
// Server Actions para el manejo de imágenes en Base64.
// El cliente convierte cualquier imagen a WebP antes de enviar.
// ⚠️ SERVER-ONLY: Punto de entrada seguro desde el cliente.
// =========================================================
"use server";

import "server-only";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/modules/registration/types/action-result.types";

/**
 * Server Action para subir y guardar la imagen de portada de un evento en Base64 en la base de datos.
 *
 * El cliente es responsable de convertir la imagen a WebP antes de invocar
 * este action (ver ImageUploadField.tsx → convertToWebP). Aquí solo se
 * valida el tamaño como medida de defensa en profundidad.
 *
 * @param formData - FormData que contiene el archivo de imagen WebP bajo la clave "image"
 * @param eventId - El UUID del evento al que asociar la imagen
 */
export async function uploadEventImage(
  formData: FormData,
  eventId: string
): Promise<ActionResult<{ imageBase64: string }>> {
  try {
    if (!eventId) {
      return {
        success: false,
        error: "El identificador del evento es requerido para guardar la imagen.",
      };
    }

    const file = formData.get("image") as File | null;
    if (!file) {
      return {
        success: false,
        error: "No se proporcionó ningún archivo de imagen.",
      };
    }

    // Defensa en profundidad: validar que el archivo sea una imagen
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "Solo se permiten archivos de imagen.",
      };
    }

    // Validación de tamaño: máximo 1 MB (el cliente ya debería optimizar, pero
    // esta comprobación sirve como garantía adicional en el servidor)
    const maxSizeBytes = 1 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeInKb = (file.size / 1024).toFixed(1);
      return {
        success: false,
        error: `La imagen excede el límite máximo de 1 MB (recibido: ${sizeInKb} KB). Reduce la resolución de la imagen.`,
      };
    }

    // Leer el archivo como un array buffer y codificar en base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64String = buffer.toString("base64");

    // Guardar directamente en la base de datos en la columna imageBase64
    await db.event.update({
      where: { id: eventId },
      data: {
        imageBase64: base64String,
      },
    });

    // Revalidación de caché en todas las rutas clave
    revalidatePath("/admin/eventos");
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    revalidatePath("/registro");

    return {
      success: true,
      data: { imageBase64: base64String },
    };
  } catch (error) {
    console.error("Error al subir la imagen del evento:", error);
    return {
      success: false,
      error: "Ocurrió un error interno en el servidor al procesar la imagen.",
    };
  }
}

/**
 * Server Action para eliminar la imagen de un evento (poner imageBase64 en null).
 *
 * @param eventId - El UUID del evento
 */
export async function removeEventImage(
  eventId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    if (!eventId) {
      return {
        success: false,
        error: "El identificador del evento es requerido.",
      };
    }

    await db.event.update({
      where: { id: eventId },
      data: {
        imageBase64: null,
      },
    });

    revalidatePath("/admin/eventos");
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    revalidatePath("/registro");

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error al eliminar la imagen del evento:", error);
    return {
      success: false,
      error: "Ocurrió un error interno en el servidor al eliminar la imagen.",
    };
  }
}
