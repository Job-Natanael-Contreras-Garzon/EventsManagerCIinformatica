// src/modules/events/schema.ts
// =========================================================
// Schema Zod isomórfico para el módulo de eventos.
// ⚠️ Este archivo NO tiene "use server" / "use client".
//    Se ejecuta tanto en el cliente como en el servidor.
// =========================================================
import { z } from "zod";

export const eventSchema = z.object({
  id: z
    .string()
    .uuid("El identificador del evento no es válido.")
    .optional()
    .or(z.literal("")),
  name: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(100, "El título no puede superar 100 caracteres."),
  description: z
    .string()
    .max(1000, "La descripción no puede superar 1000 caracteres.")
    .optional()
    .nullable()
    .or(z.literal("")),
  /** Tipo de evento: INDIVIDUAL, TEAM, OPEN (libre participación / informativo) */
  type: z.enum(["INDIVIDUAL", "TEAM", "OPEN"], {
    message: "Tipo de evento no válido.",
  }),
  /** Estado del evento: AVAILABLE (próximo), IN_PROGRESS (en curso), FINISHED (finalizado) */
  status: z.enum(["AVAILABLE", "IN_PROGRESS", "FINISHED"]),
  /** Género al que se dirige el evento */
  gender: z.enum(["WOMEN", "MEN", "BOTH"]),
  categoryId: z.string().uuid("La categoría seleccionada no es válida."),
  maxParticipants: z
    .number({
      message: "Debe ser un número.",
    })
    .int("Debe ser un número entero.")
    .min(1, "El cupo mínimo debe ser al menos 1.")
    .nullable()
    .optional(),
  maxTeamMembers: z
    .number({
      message: "Debe ser un número.",
    })
    .int("Debe ser un número entero.")
    .min(1, "El número de integrantes mínimo debe ser al menos 1.")
    .optional(),
  /** Inscripciones abiertas o cerradas (independiente del status) */
  isActive: z.boolean({
    message: "El estado de inscripciones es requerido.",
  }),
  date: z.string().min(1, "La fecha del evento es requerida."),
  registrationDeadline: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),
  /** Nombre del ganador o equipo ganador — opcional, no aplica a OPEN ni conferencias */
  winnerName: z.string().max(200).optional().nullable().or(z.literal("")),
  /** Campos dinámicos adicionales: [{ label, value }] */
  customFields: z
    .array(
      z.object({
        label: z.string().min(1, "El nombre del campo es requerido."),
        value: z.string(),
      })
    )
    .optional()
    .default([]),
  /** Campos que se ocultan en el catálogo público */
  disabledFields: z.array(z.string()).optional().default([]),
  /** IDs de los encargados del evento (usuarios del sistema) */
  encargadoUserIds: z
    .array(z.string().uuid())
    .optional()
    .default([]),
  imageBase64: z.string().optional().nullable(),
  /** Enlace de grupo de WhatsApp opcional */
  whatsappGroupUrl: z
    .string()
    .url("El enlace del grupo de WhatsApp no es válido (debe empezar con http:// o https://).")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(50, "El nombre no puede superar 50 caracteres."),
});

export type CategoryInput = z.infer<typeof categorySchema>;


/** Tipo inferido del schema de entrada */
export type EventInput = z.infer<typeof eventSchema>;

export const eventResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(["INDIVIDUAL", "TEAM", "OPEN"]),
  status: z.enum(["AVAILABLE", "IN_PROGRESS", "FINISHED"]),
  gender: z.enum(["WOMEN", "MEN", "BOTH"]),
  categoryId: z.string().uuid(),
  maxParticipants: z.number().nullable(),
  isActive: z.boolean(),
  date: z.string(),
  registrationDeadline: z.string().nullable(),
  winnerName: z.string().nullable().optional(),
  whatsappGroupUrl: z.string().nullable().optional(),
});

export type EventResponse = z.infer<typeof eventResponseSchema>;
