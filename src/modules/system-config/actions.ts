"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";
import { getCurrentUser } from "@/modules/auth/utils/session";
import type { ActionResult } from "@/modules/registration/types/action-result.types";

const systemConfigSchema = z.object({
  title1: z.string().min(1, "El título 1 es requerido.").max(100),
  title2: z.string().min(1, "El título 2 es requerido.").max(100),
  description: z.string().min(1, "La descripción es requerida.").max(500),
});

export type SystemConfigInput = z.infer<typeof systemConfigSchema>;

/**
 * Server Action: Actualiza la configuración del header del catálogo público.
 * Solo accesible por administradores.
 */
export async function updateSystemConfig(rawInput: unknown): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return {
      success: false,
      error: "Acceso denegado. Solo los administradores pueden modificar la configuración.",
    };
  }

  const parsed = systemConfigSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Los datos de configuración son inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db.systemConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        title1: parsed.data.title1,
        title2: parsed.data.title2,
        description: parsed.data.description,
      },
      update: {
        title1: parsed.data.title1,
        title2: parsed.data.title2,
        description: parsed.data.description,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/dashboard");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[SystemConfig] Error al actualizar la configuración:", error);
    return {
      success: false,
      error: "Ocurrió un error interno al guardar la configuración.",
    };
  }
}

/**
 * Obtiene la configuración actual del sistema.
 * Retorna los valores por defecto si no existe configuración guardada.
 */
export async function getSystemConfig(): Promise<{
  title1: string;
  title2: string;
  description: string;
}> {
  try {
    const config = await db.systemConfig.findUnique({
      where: { id: "default" },
      select: { title1: true, title2: true, description: true },
    });

    if (config) return config;
  } catch (error) {
    console.error("[SystemConfig] Error al obtener configuración:", error);
  }

  // Valores por defecto
  return {
    title1: "SEMANA FACULTATIVA 2026",
    title2: "Catálogo de Eventos",
    description:
      "Portal Oficial de Inscripcion para Actividades organizadas por el Centro Interno de Ingenieria Informatica. Encuentra todos los Eventos Disponibles, Inscribete facilmente y se parte de nuestras Actividades academicas, deportivas y culturales.",
  };
}
