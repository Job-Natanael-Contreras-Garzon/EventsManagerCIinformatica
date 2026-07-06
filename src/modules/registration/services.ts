// src/modules/registration/services.ts
// =========================================================
// Service de persistencia y consultas de BD.
// ⚠️ SERVER-ONLY: Solo importable en Server Actions o Components.
// =========================================================
import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { RegistrationError } from "./utils/errors";
import { generateConfirmationCode } from "./utils/confirmation-code";
import type { RegistrationInput, RegistrationResponse } from "./schema";
import type { ActiveEvent } from "./types/event.types";

/** Límite estándar de miembros permitidos por equipo */
const MAX_TEAM_MEMBERS = 5;

/**
 * Obtiene todos los eventos activos con su categoría y encargados.
 *
 * Optimizaciones:
 * - Select explícito para evitar cargar datos innecesarios.
 * - Sin N+1 queries: categoría y encargados en una sola query.
 * - Ordenados por fecha.
 *
 * @returns Lista de eventos activos listos para renderizar.
 */
export async function getActiveEvents(): Promise<ActiveEvent[]> {
  // Retorna TODOS los eventos (con inscripciones abiertas o cerradas, y cualquier estado)
  // para que el catálogo muestre el panorama completo incluyendo los finalizados.
  const events = await db.event.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      status: true,
      gender: true,
      date: true,
      isActive: true,
      registrationDeadline: true,
      maxParticipants: true,
      imageBase64: true,
      winnerName: true,
      customFields: true,
      disabledFields: true,
      category: {
        select: { id: true, name: true },
      },
      encargados: {
        select: { id: true, name: true, phone: true, whatsappUrl: true },
        orderBy: { name: "asc" },
      },
      _count: {
        select: { registrations: true, teams: true },
      },
    },
    orderBy: { date: "asc" },
  });

  return events.map((event) => {
    // Parsear customFields desde JSON
    let customFields: { label: string; value: string }[] = [];
    try {
      if (typeof event.customFields === "string") {
        customFields = JSON.parse(event.customFields);
      } else if (Array.isArray(event.customFields)) {
        customFields = event.customFields as { label: string; value: string }[];
      }
    } catch { customFields = []; }

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      type: event.type,
      status: event.status ?? "AVAILABLE",
      gender: event.gender ?? "BOTH",
      date: event.date.toISOString(),
      isActive: event.isActive,
      registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
      maxParticipants: event.maxParticipants,
      imageBase64: event.imageBase64,
      winnerName: event.winnerName ?? null,
      customFields,
      disabledFields: event.disabledFields ?? [],
      category: {
        id: event.category.id,
        name: event.category.name,
      },
      encargados: event.encargados.map((enc) => ({
        id: enc.id,
        name: enc.name,
        phone: enc.phone,
        whatsappUrl: enc.whatsappUrl,
      })),
      currentRegistrations: event.type === "TEAM" ? event._count.teams : event._count.registrations,
    };
  });
}

/**
 * Registra un participante en un evento (individual o grupal) en una transacción ACID.
 *
 * Flujo:
 * 1. Verificaciones rápidas previas (fuera de la transacción para eficiencia).
 * 2. Transacción de base de datos ($transaction) para garantizar atomicidad:
 *    a. Verificar que el participante no esté inscrito en este evento.
 *    b. Re-verificar cupos del evento de forma aislada.
 *    c. Upsert del participante por su registerCode.
 *    d. Si es 'create_team': Generar código de 6 caracteres único y crear equipo.
 *    e. Si es 'join_team': Buscar código de equipo, validar cupos del equipo (max 5) y asociar.
 *    f. Crear el registro de inscripción.
 *
 * @param input - Datos validados del formulario.
 * @returns DTO de respuesta seguro con la confirmación.
 * @throws {RegistrationError} Si ocurre un error de negocio (cupos, duplicados, etc.).
 */
export async function registerParticipant(
  input: RegistrationInput
): Promise<RegistrationResponse> {
  // ── Paso 1: Verificaciones rápidas previas ─────────────────────────────────
  const event = await db.event.findUnique({
    where: { id: input.eventId },
    select: {
      id: true,
      name: true,
      isActive: true,
      type: true,
      maxTeamMembers: true,
      registrationDeadline: true,
      maxParticipants: true,
      _count: { select: { registrations: true, teams: true } },
    },
  });

  if (!event) {
    throw new RegistrationError("El evento seleccionado no existe.", "EVENT_NOT_FOUND", 404);
  }

  if (!event.isActive) {
    throw new RegistrationError("El registro para este evento está cerrado.", "REGISTRATION_CLOSED");
  }

  if (event.registrationDeadline && event.registrationDeadline < new Date()) {
    throw new RegistrationError("La fecha límite de inscripción ha pasado.", "REGISTRATION_CLOSED");
  }

  if (event.maxParticipants !== null) {
    const isTeam = event.type === "TEAM";
    if (isTeam) {
      if (event._count.teams >= event.maxParticipants) {
        throw new RegistrationError(
          "Este evento ya alcanzó su capacidad máxima de equipos.",
          "EVENT_FULL"
        );
      }
    } else {
      if (event._count.registrations >= event.maxParticipants) {
        throw new RegistrationError(
          "Este evento ya alcanzó su capacidad máxima de participantes.",
          "EVENT_FULL"
        );
      }
    }
  }

  // Si se une a un equipo existente, validar la existencia del equipo antes de la tx
  let existingTeamCache: { id: string; name: string; eventId: string } | null = null;
  if (input.registrationType === "join_team") {
    if (!input.teamCode) {
      throw new RegistrationError("Código de equipo no proporcionado.", "TEAM_NOT_FOUND");
    }

    const team = await db.team.findUnique({
      where: { code: input.teamCode },
      select: {
        id: true,
        name: true,
        eventId: true,
        _count: { select: { registrations: true } },
      },
    });

    if (!team || team.eventId !== input.eventId) {
      throw new RegistrationError(
        "El equipo con el código proporcionado no existe en este evento.",
        "TEAM_NOT_FOUND",
        404
      );
    }

    if (team._count.registrations >= event.maxTeamMembers) {
      throw new RegistrationError(
        `El equipo "${team.name}" ya está lleno (máximo ${event.maxTeamMembers} integrantes).`,
        "TEAM_FULL"
      );
    }

    existingTeamCache = team;
  }

  // ── Paso 2: Transacción ACID ──────────────────────────────────────────────
  const registrationResult = await db.$transaction(
    async (tx) => {
      // 2a. Verificar si el participante ya está inscrito (atómico)
      const existingParticipant = await tx.participant.findUnique({
        where: { registerCode: input.registerCode },
        select: { id: true },
      });

      if (existingParticipant) {
        const existingRegistration = await tx.registration.findUnique({
          where: {
            participantId_eventId: {
              participantId: existingParticipant.id,
              eventId: input.eventId,
            },
          },
          select: { id: true },
        });

        if (existingRegistration) {
          throw new RegistrationError(
            "Ya estás inscrito en este evento con este código universitario.",
            "DUPLICATE_REGISTRATION"
          );
        }
      }

      // 2b. Re-verificar cupos del evento en la transacción para evitar race conditions
      if (event.maxParticipants !== null) {
        const isTeam = event.type === "TEAM";
        if (isTeam) {
          const currentEventTeams = await tx.team.count({
            where: { eventId: input.eventId },
          });
          if (currentEventTeams >= event.maxParticipants) {
            throw new RegistrationError(
              "El evento ya no tiene cupos para más equipos disponibles.",
              "EVENT_FULL"
            );
          }
        } else {
          const currentEventRegistrations = await tx.registration.count({
            where: { eventId: input.eventId },
          });
          if (currentEventRegistrations >= event.maxParticipants) {
            throw new RegistrationError(
              "El evento ya no tiene cupos disponibles.",
              "EVENT_FULL"
            );
          }
        }
      }

      // 2c. Upsert del participante
      const participant = await tx.participant.upsert({
        where: { registerCode: input.registerCode },
        create: {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          registerCode: input.registerCode,
        },
        update: {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
        },
        select: { id: true, fullName: true },
      });

      let teamId: string | null = null;
      let finalTeamCode: string | undefined = undefined;
      let finalTeamName: string | undefined = undefined;

      // 2d. Crear equipo
      if (input.registrationType === "create_team") {
        finalTeamName = input.teamName || "Equipo sin nombre";
        finalTeamCode = await generateUniqueTeamCode(tx);

        const newTeam = await tx.team.create({
          data: {
            name: finalTeamName,
            code: finalTeamCode,
            eventId: input.eventId,
            leaderId: participant.id,
          },
          select: { id: true },
        });
        teamId = newTeam.id;
      }
      // 2e. Unirse a equipo existente
      else if (input.registrationType === "join_team") {
        if (!existingTeamCache) {
          throw new RegistrationError("Equipo no encontrado.", "TEAM_NOT_FOUND");
        }

        // Re-verificar capacidad del equipo atómicamente
        const currentTeamMembers = await tx.registration.count({
          where: { teamId: existingTeamCache.id },
        });

        if (currentTeamMembers >= event.maxTeamMembers) {
          throw new RegistrationError(
            `El equipo "${existingTeamCache.name}" ya está completo (máximo ${event.maxTeamMembers} integrantes).`,
            "TEAM_FULL"
          );
        }

        teamId = existingTeamCache.id;
        finalTeamCode = input.teamCode;
        finalTeamName = existingTeamCache.name;
      }

      // 2f. Crear la inscripción
      const confirmationCode = generateConfirmationCode();
      const newRegistration = await tx.registration.create({
        data: {
          participantId: participant.id,
          eventId: input.eventId,
          confirmationCode,
          status: "PENDING",
          teamId,
        },
        select: {
          confirmationCode: true,
          createdAt: true,
        },
      });

      return {
        confirmationCode: newRegistration.confirmationCode,
        participantName: participant.fullName,
        createdAt: newRegistration.createdAt,
        teamCode: finalTeamCode,
        teamName: finalTeamName,
      };
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );

  // Mapear a DTO de respuesta seguro
  return {
    confirmationCode: registrationResult.confirmationCode,
    participantName: registrationResult.participantName,
    eventName: event.name,
    registeredAt: registrationResult.createdAt.toISOString(),
    registrationType: input.registrationType,
    teamCode: registrationResult.teamCode,
    teamName: registrationResult.teamName,
  };
}

/**
 * Genera un código único alfanumérico de 6 caracteres para equipos,
 * garantizando la unicidad dentro de la transacción.
 */
async function generateUniqueTeamCode(
  tx: Prisma.TransactionClient
): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let attempts = 0;

  while (attempts < 10) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const existing = await tx.team.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new RegistrationError(
    "No se pudo generar un código único de equipo. Por favor intente de nuevo.",
    "DB_TRANSACTION_FAILED"
  );
}
