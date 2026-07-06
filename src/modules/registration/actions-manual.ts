"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";
import { getCurrentUser } from "@/modules/auth/utils/session";
import { generateConfirmationCode } from "@/modules/registration/utils/confirmation-code";
import type { ActionResult } from "@/modules/registration/types/action-result.types";

/**
 * Schema para el registro manual de participantes por admin/coordinador.
 * Más flexible que el schema público — no valida formato estricto de celular boliviano.
 */
const manualRegistrationSchema = z.object({
  fullName: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(100, "El nombre no puede superar 100 caracteres."),
  registerCode: z
    .string()
    .min(4, "El código universitario debe tener al menos 4 caracteres.")
    .max(20, "El código universitario no puede superar 20 caracteres."),
  email: z
    .string()
    .email("Debe ser un correo válido.")
    .max(254)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(6, "El número de celular debe tener al menos 6 dígitos.")
    .max(20),
  eventId: z.string().uuid("El identificador del evento no es válido."),
  teamName: z
    .string()
    .max(50)
    .optional()
    .or(z.literal("")),
  teamCode: z
    .string()
    .max(10)
    .optional()
    .or(z.literal("")),
});

type ManualRegistrationInput = z.infer<typeof manualRegistrationSchema>;

/**
 * Server Action: Registra manualmente a un participante en un evento.
 * Solo accesible por administradores o coordinadores asignados al evento.
 *
 * - registerCode es proporcionado por el usuario administrador.
 * - confirmationCode se genera automáticamente.
 * - No se validan plazos de inscripción — el admin/coordinador puede registrar en cualquier momento.
 */
export async function registerPlayerManually(
  rawInput: unknown
): Promise<ActionResult<{ confirmationCode: string }>> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "No autorizado. Por favor inicia sesión." };
  }

  const parsed = manualRegistrationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Los datos del formulario son inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;

  // Verificar que el evento exista
  const event = await db.event.findUnique({
    where: { id: input.eventId },
    select: {
      id: true,
      name: true,
      type: true,
      maxParticipants: true,
      maxTeamMembers: true,
      _count: { select: { registrations: true, teams: true } },
      encargados: currentUser.role === "COORDINATOR"
        ? { where: { userId: currentUser.userId }, select: { id: true } }
        : undefined,
    },
  });

  if (!event) {
    return { success: false, error: "El evento seleccionado no existe." };
  }

  // Coordinador solo puede registrar en sus eventos asignados
  if (currentUser.role === "COORDINATOR") {
    const isAssigned = event.encargados && event.encargados.length > 0;
    if (!isAssigned) {
      return {
        success: false,
        error: "No estás asignado como encargado de este evento.",
      };
    }
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // Verificar si el código universitario ya está en uso
      const existingByCode = await tx.participant.findUnique({
        where: { registerCode: input.registerCode },
        select: { id: true },
      });

      if (existingByCode) {
        // Verificar si ya está inscrito en este evento
        const existingReg = await tx.registration.findUnique({
          where: {
            participantId_eventId: {
              participantId: existingByCode.id,
              eventId: input.eventId,
            },
          },
          select: { id: true },
        });

        if (existingReg) {
          throw new Error("DUPLICATE_REGISTRATION");
        }
      }

      // Verificar si el email ya existe (si se proporcionó)
      if (input.email) {
        const existingByEmail = await tx.participant.findUnique({
          where: { email: input.email },
          select: { id: true, registerCode: true },
        });
        if (existingByEmail && existingByEmail.registerCode !== input.registerCode) {
          throw new Error("EMAIL_IN_USE");
        }
      }

      // Upsert del participante
      const participant = await tx.participant.upsert({
        where: { registerCode: input.registerCode },
        create: {
          fullName: input.fullName,
          email: input.email || null,
          phone: input.phone,
          registerCode: input.registerCode,
        },
        update: {
          fullName: input.fullName,
          phone: input.phone,
        },
        select: { id: true, fullName: true },
      });

      // Manejar equipo si se especificó
      let teamId: string | null = null;
      if (event.type === "TEAM" && input.teamCode) {
        // Unirse a equipo existente
        const team = await tx.team.findUnique({
          where: { code: input.teamCode.toUpperCase() },
          select: { id: true, name: true, eventId: true, _count: { select: { registrations: true } } },
        });
        if (team && team.eventId === input.eventId) {
          teamId = team.id;
        }
      } else if (event.type === "TEAM" && input.teamName && input.teamName.trim()) {
        // Crear nuevo equipo
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const newTeam = await tx.team.create({
          data: {
            name: input.teamName.trim(),
            code,
            eventId: input.eventId,
            leaderId: participant.id,
          },
          select: { id: true },
        });
        teamId = newTeam.id;
      }

      // Crear la inscripción
      const confirmationCode = generateConfirmationCode();
      await tx.registration.create({
        data: {
          participantId: participant.id,
          eventId: input.eventId,
          confirmationCode,
          status: "CONFIRMED",
          isManual: true,
          teamId,
        },
      });

      return { confirmationCode };
    });

    revalidatePath("/admin/registrados");
    revalidatePath("/admin/dashboard");
    revalidatePath("/");

    return { success: true, data: { confirmationCode: result.confirmationCode } };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DUPLICATE_REGISTRATION") {
        return {
          success: false,
          error: "Este participante ya está inscrito en el evento.",
          fieldErrors: { registerCode: ["Este código universitario ya está registrado para el evento."] },
        };
      }
      if (error.message === "EMAIL_IN_USE") {
        return {
          success: false,
          error: "El correo electrónico ya está asociado a otro código universitario.",
          fieldErrors: { email: ["Este correo ya está en uso por otro participante."] },
        };
      }
    }
    console.error("[Manual Registration] Error:", error);
    return {
      success: false,
      error: "Ocurrió un error interno al intentar registrar al participante.",
    };
  }
}
