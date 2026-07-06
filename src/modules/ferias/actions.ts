// src/modules/ferias/actions.ts
"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { feriaSchema, type FeriaInput } from "./schema";
import type { ActionResult } from "@/modules/registration/types/action-result.types";
import { getCurrentUser } from "@/modules/auth/utils/session";

function formatPhoneAndWhatsapp(rawPhone: string) {
  const cleanPhone = rawPhone.replace(/[\s\-\(\)\+]/g, "");
  if (!cleanPhone) return { phone: "", whatsappUrl: "" };
  let phone = cleanPhone;
  if (cleanPhone.length === 8 && (cleanPhone.startsWith("6") || cleanPhone.startsWith("7"))) {
    phone = `591${cleanPhone}`;
  }
  return {
    phone,
    whatsappUrl: `https://wa.me/${phone}`,
  };
}

export async function upsertFeria(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "No autorizado. Por favor inicia sesión." };
  }

  const parsed = feriaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Los datos del formulario son inválidos. Por favor, revíselos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const validatedInput: FeriaInput = parsed.data;

  // Coordinador no puede crear/editar ferias en las que no esté asignado
  if (currentUser.role === "COORDINATOR") {
    if (!validatedInput.id) {
      return {
        success: false,
        error: "Acceso denegado. Solo los administradores pueden crear nuevas ferias.",
      };
    }

    const assigned = await db.encargado.findFirst({
      where: { feriaId: validatedInput.id, userId: currentUser.userId },
      select: { id: true },
    });
    if (!assigned) {
      return {
        success: false,
        error: "Acceso denegado. Solo puedes editar ferias en las que estás asignado como encargado.",
      };
    }
  }

  try {
    const finalDescription = validatedInput.description || "";
    const finalCost = validatedInput.cost || "Gratuito";
    const feriaId = validatedInput.id || undefined;
    const encargadoUserIds = validatedInput.encargadoUserIds ?? [];

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

    let savedFeria;

    if (feriaId) {
      // Clear existing encargados associated with this feria to prevent duplicates
      await db.encargado.deleteMany({
        where: { feriaId },
      });

      savedFeria = await db.feria.update({
        where: { id: feriaId },
        data: {
          name: validatedInput.name,
          description: finalDescription,
          cost: finalCost,
          dates: validatedInput.dates,
          registrationUrl: validatedInput.registrationUrl || null,
          imageBase64: validatedInput.imageBase64 ?? null,
          isActive: validatedInput.isActive,
          encargados: encargadosData.length > 0
            ? { create: encargadosData }
            : undefined,
        },
        select: { id: true },
      });
    } else {
      savedFeria = await db.feria.create({
        data: {
          name: validatedInput.name,
          description: finalDescription,
          cost: finalCost,
          dates: validatedInput.dates,
          registrationUrl: validatedInput.registrationUrl || null,
          imageBase64: validatedInput.imageBase64 ?? null,
          isActive: validatedInput.isActive,
          encargados: encargadosData.length > 0
            ? { create: encargadosData }
            : undefined,
        },
        select: { id: true },
      });
    }

    revalidatePath("/admin/ferias");
    revalidatePath("/admin/dashboard");
    revalidatePath("/");

    return {
      success: true,
      data: { id: savedFeria.id },
    };
  } catch (error) {
    console.error("Error al guardar la feria:", error);
    return {
      success: false,
      error: "Ocurrió un error interno en el servidor al intentar guardar la feria.",
    };
  }
}

export async function deleteFeria(
  feriaId: string
): Promise<ActionResult<{ success: boolean }>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Acceso denegado. Solo los administradores pueden eliminar ferias." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.encargado.deleteMany({ where: { feriaId } });
      await tx.feria.delete({ where: { id: feriaId } });
    });

    revalidatePath("/admin/ferias");
    revalidatePath("/admin/dashboard");
    revalidatePath("/");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Error al eliminar la feria:", error);
    return {
      success: false,
      error: "Ocurrió un error interno al intentar eliminar la feria.",
    };
  }
}

export async function updateFeriaStatus(
  feriaId: string,
  isActive: boolean
): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "No autorizado." };
  }

  if (currentUser.role === "COORDINATOR") {
    const assigned = await db.encargado.findFirst({
      where: { feriaId, userId: currentUser.userId },
      select: { id: true },
    });
    if (!assigned) {
      return { success: false, error: "Acceso denegado." };
    }
  }

  try {
    await db.feria.update({
      where: { id: feriaId },
      data: { isActive },
    });

    revalidatePath("/admin/ferias");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error al actualizar estado de la feria:", error);
    return { success: false, error: "Ocurrió un error al actualizar el estado." };
  }
}
