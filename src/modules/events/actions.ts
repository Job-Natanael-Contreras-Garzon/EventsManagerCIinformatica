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
import { getCurrentUser } from "@/modules/auth/utils/session";

/**
 * Helper para obtener el número de celular de un usuario formateado para WhatsApp.
 */
function formatPhoneAndWhatsapp(rawPhone: string) {
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
}

/**
 * Server Action: Crea o actualiza un torneo/evento.
 *
 * Flujo:
 * 1. Verificar permisos (admin puede todo; coordinador solo eventos asignados).
 * 2. Re-validación estricta con Zod en el servidor.
 * 3. Si es edición, verifica que maxParticipants no sea menor que los inscritos actuales.
 * 4. Guarda o actualiza en la base de datos usando Prisma.
 * 5. Revalida la caché del panel y la home para ver los cambios de inmediato.
 *
 * @param rawInput - Datos crudos del formulario (unknown).
 * @returns ActionResult con el evento guardado o los errores correspondientes.
 */
export async function upsertEvent(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  // ── Verificar autenticación ───────────────────────────────────────────────
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "No autorizado. Por favor inicia sesión." };
  }

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

  // Si es coordinador, no puede crear eventos. Si es edición, debe estar asignado.
  if (currentUser.role === "COORDINATOR") {
    if (!validatedInput.id) {
      return {
        success: false,
        error: "Acceso denegado. Solo los administradores pueden crear nuevos torneos.",
      };
    }

    const assigned = await db.encargado.findFirst({
      where: { eventId: validatedInput.id, userId: currentUser.userId },
      select: { id: true },
    });
    if (!assigned) {
      return {
        success: false,
        error: "Acceso denegado. Solo puedes editar eventos en los que estás asignado como encargado.",
      };
    }
  }

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

    // ── Paso 3: Limpiar sufijos de nombre para tipo no-TEAM ───────────────
    if (validatedInput.type !== "TEAM") {
      finalName = finalName
        .replace(/\s*\[equipo\]\s*/i, "")
        .replace(/\s*\[team\]\s*/i, "")
        .replace(/\s*\[equipos\]\s*/i, "");
    }

    const eventDate = new Date(validatedInput.date);
    const registrationDeadline = validatedInput.registrationDeadline
      ? new Date(validatedInput.registrationDeadline)
      : null;

    // ── Paso 4: Preparar datos de encargados desde IDs de usuarios ─────────
    let savedEvent;
    const encargadoUserIds = validatedInput.encargadoUserIds ?? [];

    // Obtener los datos de los usuarios seleccionados como encargados
    const selectedUsers = encargadoUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: encargadoUserIds } },
          select: { id: true, name: true, phone: true },
        })
      : [];

    const encargadosData = selectedUsers.map((u) => ({
      userId: u.id,
      name: u.name,
      ...formatPhoneAndWhatsapp(u.phone),
    }));

    // Campos dinámicos y desactivados
    const customFieldsJson = JSON.stringify(validatedInput.customFields ?? []);
    const disabledFieldsArr = validatedInput.disabledFields ?? [];
    const winnerName = validatedInput.winnerName || null;

    // ── Paso 5: Guardar en la Base de Datos ───────────────────────────────
    if (validatedInput.id) {
      // Clear existing encargados associated with this event to prevent duplicates
      await db.encargado.deleteMany({
        where: { eventId: validatedInput.id },
      });

      // Handle transitioning from TEAM to non-TEAM (Clean up registrations & teams)
      const existingEventType = await db.event.findUnique({
        where: { id: validatedInput.id },
        select: { type: true },
      });
      const wasTeam = existingEventType?.type === "TEAM";
      const isTeam = validatedInput.type === "TEAM";

      if (wasTeam && !isTeam) {
        await db.$transaction(async (tx) => {
          await tx.registration.updateMany({
            where: { eventId: validatedInput.id },
            data: { teamId: null },
          });
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
          status: validatedInput.status,
          gender: validatedInput.gender,
          maxParticipants: validatedInput.maxParticipants,
          maxTeamMembers: validatedInput.maxTeamMembers ?? 5,
          imageBase64: validatedInput.imageBase64 ?? null,
          isActive: validatedInput.isActive,
          categoryId: validatedInput.categoryId,
          date: eventDate,
          registrationDeadline: registrationDeadline,
          winnerName,
          customFields: customFieldsJson as any,
          disabledFields: disabledFieldsArr,
          encargados: encargadosData.length > 0
            ? { create: encargadosData }
            : undefined,
        },
        select: { id: true },
      });
    } else {
      savedEvent = await db.event.create({
        data: {
          name: finalName,
          description: finalDescription,
          type: validatedInput.type,
          status: validatedInput.status,
          gender: validatedInput.gender,
          maxParticipants: validatedInput.maxParticipants,
          maxTeamMembers: validatedInput.maxTeamMembers ?? 5,
          imageBase64: validatedInput.imageBase64 ?? null,
          isActive: validatedInput.isActive,
          categoryId: validatedInput.categoryId,
          date: eventDate,
          registrationDeadline: registrationDeadline,
          winnerName,
          customFields: customFieldsJson as any,
          disabledFields: disabledFieldsArr,
          encargados: encargadosData.length > 0
            ? { create: encargadosData }
            : undefined,
        },
        select: { id: true },
      });
    }

    // ── Paso 6: Revalidación de Caché ───────────────────────────────────────
    revalidatePath("/admin/eventos");
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    revalidatePath("/registro");

    return {
      success: true,
      data: { id: savedEvent.id },
    };
  } catch (error) {
    console.error("Error al guardar el evento:", error);
    return {
      success: false,
      error: "Ocurrió un error interno en el servidor al intentar guardar el evento.",
    };
  }
}

/**
 * Server Action: Actualiza el estado de un evento (AVAILABLE / IN_PROGRESS / FINISHED).
 */
export async function updateEventStatus(
  eventId: string,
  status: "AVAILABLE" | "IN_PROGRESS" | "FINISHED"
): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "No autorizado." };
  }

  // Verificar permisos de coordinador
  if (currentUser.role === "COORDINATOR") {
    const assigned = await db.encargado.findFirst({
      where: { eventId, userId: currentUser.userId },
      select: { id: true },
    });
    if (!assigned) {
      return { success: false, error: "Acceso denegado." };
    }
  }

  try {
    await db.event.update({
      where: { id: eventId },
      data: { status },
    });

    revalidatePath("/admin/eventos");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error al actualizar estado del evento:", error);
    return { success: false, error: "Ocurrió un error al actualizar el estado." };
  }
}

/**
 * Server Action: Establece o quita el ganador de un evento.
 * winnerName = null para quitar el ganador.
 */
export async function setEventWinner(
  eventId: string,
  winnerName: string | null
): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "No autorizado." };
  }

  if (currentUser.role === "COORDINATOR") {
    const assigned = await db.encargado.findFirst({
      where: { eventId, userId: currentUser.userId },
      select: { id: true },
    });
    if (!assigned) {
      return { success: false, error: "Acceso denegado." };
    }
  }

  try {
    await db.event.update({
      where: { id: eventId },
      data: { winnerName: winnerName || null },
    });

    revalidatePath("/admin/eventos");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error al establecer ganador:", error);
    return { success: false, error: "Ocurrió un error al establecer el ganador." };
  }
}

/**
 * Server Action: Elimina un torneo/evento y todas sus relaciones asociadas de forma transaccional.
 */
export async function deleteEvent(
  eventId: string
): Promise<ActionResult<{ success: boolean }>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Acceso denegado. Solo los administradores pueden eliminar eventos." };
  }

  try {
    // Transaction to safely drop all child relationships before dropping the event
    await db.$transaction(async (tx) => {
      await tx.registration.deleteMany({ where: { eventId } });
      await tx.team.deleteMany({ where: { eventId } });
      await tx.encargado.deleteMany({ where: { eventId } });
      await tx.event.delete({ where: { id: eventId } });
    });

    revalidatePath("/admin/eventos");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/registrados");
    revalidatePath("/");
    revalidatePath("/registro");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Error al eliminar el evento:", error);
    return {
      success: false,
      error: "Ocurrió un error interno al intentar eliminar el evento y sus relaciones.",
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

    const existing = await db.category.findUnique({ where: { name } });

    if (existing) {
      return {
        success: false,
        error: "Ya existe una categoría con ese nombre.",
        fieldErrors: {
          name: ["Este nombre de categoría ya está registrado."],
        },
      };
    }

    const newCategory = await db.category.create({ data: { name } });

    revalidatePath("/admin/eventos");
    revalidatePath("/");
    revalidatePath("/registro");

    return { success: true, data: { id: newCategory.id } };
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
    const eventCount = await db.event.count({ where: { categoryId: id } });

    if (eventCount > 0) {
      return {
        success: false,
        error: "No se puede eliminar la categoría porque tiene torneos asociados.",
      };
    }

    await db.category.delete({ where: { id } });

    revalidatePath("/admin/eventos");
    revalidatePath("/");
    revalidatePath("/registro");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Error al eliminar la categoría:", error);
    return {
      success: false,
      error: "Ocurrió un error interno al intentar eliminar la categoría.",
    };
  }
}
