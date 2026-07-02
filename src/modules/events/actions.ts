// src/modules/events/actions.ts
// =========================================================
// Server Actions: Orquestadora de mutaciones y peticiones de Eventos.
// ⚠️ SERVER-ONLY: Punto de entrada desde el cliente.
// =========================================================
"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { eventSchema, categorySchema, type EventInput } from "./schema";
import type { ActionResult } from "@/modules/registration/types/action-result.types";

/**
 * Helper to identify team events based on name/description keywords
 */
const isTeamEvent = (name: string, description?: string | null) => {
  const n = name.toLowerCase();
  const d = (description || "").toLowerCase();
  const teamKeywords = ["5v5", "team", "equipo", "lol", "league of legends", "valorant", "futsal", "fútbol", "futbol"];
  return teamKeywords.some(keyword => n.includes(keyword) || d.includes(keyword));
};

/**
 * Server Action: Crea o actualiza un torneo/evento.
 *
 * Flujo:
 * 1. Re-validación estricta con Zod en el servidor.
 * 2. Si es edición, verifica que maxParticipants no sea menor que los inscritos actuales.
 * 3. En caso de ser de tipo TEAM y no tener palabras clave de equipo, las añade automáticamente.
 * 4. Guarda o actualiza en la base de datos usando Prisma.
 * 5. Revalida la caché del panel y la home para ver los cambios de inmediato.
 *
 * @param rawInput - Datos crudos del formulario (unknown).
 * @returns ActionResult con el evento guardado o los errores correspondientes.
 */
export async function upsertEvent(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  // ── Paso 1: Validación Zod en el Servidor ────────────────────────────────
  const parsed = eventSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      success: false,
      error: "Los datos del formulario son inválidos. Por favor, revíselos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const validatedInput: EventInput = parsed.data;

  try {
    let finalName = validatedInput.name;
    const finalDescription = validatedInput.description || "";

    // ── Paso 2: Si es edición, verificar cupos contra inscritos ────────────
    if (validatedInput.id) {
      const existingEvent = await db.event.findUnique({
        where: { id: validatedInput.id },
        select: {
          name: true,
          description: true,
          type: true,
          _count: {
            select: { registrations: true, teams: true },
          },
        },
      });

      if (!existingEvent) {
        return {
          success: false,
          error: "El evento que intenta editar no existe.",
        };
      }

      // Validar si el evento pre-existente era de equipo
      const wasTeam = existingEvent.type === "TEAM";
      const currentCount = wasTeam
        ? existingEvent._count.teams
        : existingEvent._count.registrations;

      if (
        validatedInput.maxParticipants !== null &&
        validatedInput.maxParticipants !== undefined &&
        validatedInput.maxParticipants < currentCount
      ) {
        return {
          success: false,
          error: `Los cupos no pueden ser menores a los participantes o equipos ya inscritos (${currentCount}).`,
          fieldErrors: {
            maxParticipants: [
              `No se puede reducir los cupos por debajo de los inscritos actuales (${currentCount}).`,
            ],
          },
        };
      }
    }

    // ── Paso 3: Asegurar coincidencia de tipo (INDIVIDUAL vs TEAM) ────────
    const isTeam = validatedInput.type === "TEAM";

    if (!isTeam) {
      // If changed to INDIVIDUAL, clean up automatic team suffixes
      finalName = finalName
        .replace(/\s*\[equipo\]\s*/i, "")
        .replace(/\s*\[team\]\s*/i, "")
        .replace(/\s*\[equipos\]\s*/i, "");
    } else {
      const hasTeamKeyword = isTeamEvent(finalName, finalDescription);
      if (!hasTeamKeyword) {
        // If team type but no keywords in name/desc, append [Equipo]
        finalName = `${finalName} [Equipo]`;
      }
    }

    const eventDate = new Date(validatedInput.date);
    const registrationDeadline = validatedInput.registrationDeadline
      ? new Date(validatedInput.registrationDeadline)
      : null;

    // Helper to format phone and generate direct Whatsapp link
    const formatPhoneAndWhatsapp = (rawPhone: string) => {
      const cleanPhone = rawPhone.replace(/[\s\-\(\)\+]/g, "");
      if (!cleanPhone) return { phone: "", whatsappUrl: "" };
      let phone = cleanPhone;
      // Prepend Bolivia code if it has 8 digits starting with 6 or 7
      if (cleanPhone.length === 8 && (cleanPhone.startsWith("6") || cleanPhone.startsWith("7"))) {
        phone = `591${cleanPhone}`;
      }
      return {
        phone,
        whatsappUrl: `https://wa.me/${phone}`,
      };
    };

    let savedEvent;

    // Prepare coordinator nested data if provided
    const encargadoData = validatedInput.encargados && validatedInput.encargados.length > 0
      ? {
          create: validatedInput.encargados.map((enc) => ({
            name: enc.name,
            ...formatPhoneAndWhatsapp(enc.phone),
          })),
        }
      : undefined;

    // ── Paso 4: Guardar en la Base de Datos ───────────────────────────────
    if (validatedInput.id) {
      // Clear existing encargados associated with this event to prevent duplicates
      await db.encargado.deleteMany({
        where: { eventId: validatedInput.id },
      });

      // Handle transitioning from TEAM to INDIVIDUAL (Clean up registrations & teams)
      const existingEvent = await db.event.findUnique({
        where: { id: validatedInput.id },
        select: { type: true },
      });
      const wasTeam = existingEvent?.type === "TEAM";
      const isTeam = validatedInput.type === "TEAM";

      if (wasTeam && !isTeam) {
        await db.$transaction(async (tx) => {
          // Set teamId = null for registrations in this event
          await tx.registration.updateMany({
            where: { eventId: validatedInput.id },
            data: { teamId: null },
          });
          // Delete teams for this event
          await tx.team.deleteMany({
            where: { eventId: validatedInput.id },
          });
        });
      }

      savedEvent = await db.event.update({
        where: { id: validatedInput.id },
        data: {
          name: finalName,
          description: finalDescription,
          type: validatedInput.type,
          maxParticipants: validatedInput.maxParticipants,
          maxTeamMembers: validatedInput.maxTeamMembers ?? 5,
          imageBase64: validatedInput.imageBase64 ?? null,
          isActive: validatedInput.isActive,
          categoryId: validatedInput.categoryId,
          date: eventDate,
          registrationDeadline: registrationDeadline,
          encargados: encargadoData,
        },
        select: { id: true },
      });
    } else {
      savedEvent = await db.event.create({
        data: {
          name: finalName,
          description: finalDescription,
          type: validatedInput.type,
          maxParticipants: validatedInput.maxParticipants,
          maxTeamMembers: validatedInput.maxTeamMembers ?? 5,
          imageBase64: validatedInput.imageBase64 ?? null,
          isActive: validatedInput.isActive,
          categoryId: validatedInput.categoryId,
          date: eventDate,
          registrationDeadline: registrationDeadline,
          encargados: encargadoData,
        },
        select: { id: true },
      });
    }

    // ── Paso 5: Revalidación de Caché ───────────────────────────────────────
    revalidatePath("/admin/eventos");
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    revalidatePath("/registro");

    return {
      success: true,
      data: { id: savedEvent.id },
    };
  } catch (error) {
    console.error("Error al guardar el torneo:", error);
    return {
      success: false,
      error: "Ocurrió un error interno en el servidor al intentar guardar el torneo.",
    };
  }
}

/**
 * Server Action: Elimina un torneo/evento y todas sus relaciones asociadas de forma transaccional.
 */
export async function deleteEvent(
  eventId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    // Transaction to safely drop all child relationships before dropping the event
    await db.$transaction(async (tx) => {
      // 1. Remove registrations
      await tx.registration.deleteMany({
        where: { eventId },
      });
      // 2. Remove teams
      await tx.team.deleteMany({
        where: { eventId },
      });
      // 3. Remove encargados
      await tx.encargado.deleteMany({
        where: { eventId },
      });
      // 4. Remove event itself
      await tx.event.delete({
        where: { id: eventId },
      });
    });

    // Revalidate affected cache paths
    revalidatePath("/admin/eventos");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/registrados");
    revalidatePath("/");
    revalidatePath("/registro");

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error al eliminar el torneo:", error);
    return {
      success: false,
      error: "Ocurrió un error interno al intentar eliminar el torneo y sus relaciones.",
    };
  }
}

/**
 * Server Action: Crea una nueva categoría de evento.
 */
export async function createCategory(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      success: false,
      error: "El nombre de la categoría es inválido. Por favor, revíselo.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const name = parsed.data.name.trim();

    // Validar si ya existe
    const existing = await db.category.findUnique({
      where: { name },
    });

    if (existing) {
      return {
        success: false,
        error: "Ya existe una categoría con ese nombre.",
        fieldErrors: {
          name: ["Este nombre de categoría ya está registrado."],
        },
      };
    }

    const newCategory = await db.category.create({
      data: { name },
    });

    // Revalidar cachés
    revalidatePath("/admin/eventos");
    revalidatePath("/");
    revalidatePath("/registro");

    return {
      success: true,
      data: { id: newCategory.id },
    };
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return {
      success: false,
      error: "Ocurrió un error interno en el servidor al intentar crear la categoría.",
    };
  }
}

/**
 * Server Action: Elimina una categoría si no tiene torneos asociados.
 */
export async function deleteCategory(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    // Validar si tiene eventos asociados
    const eventCount = await db.event.count({
      where: { categoryId: id },
    });

    if (eventCount > 0) {
      return {
        success: false,
        error: "No se puede eliminar la categoría porque tiene torneos asociados.",
      };
    }

    await db.category.delete({
      where: { id },
    });

    // Revalidar cachés
    revalidatePath("/admin/eventos");
    revalidatePath("/");
    revalidatePath("/registro");

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error al eliminar la categoría:", error);
    return {
      success: false,
      error: "Ocurrió un error interno al intentar eliminar la categoría.",
    };
  }
}


