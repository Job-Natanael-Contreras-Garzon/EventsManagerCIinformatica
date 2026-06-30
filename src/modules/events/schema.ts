// src/modules/events/schema.ts
// =========================================================
// Schema Zod isomórfico para el módulo de eventos.
// ⚠️ Este archivo NO tiene "use server" / "use client".
//    Se ejecuta tanto en el cliente como en el servidor.
// =========================================================
import { z } from "zod";

export const eventSchema = z.object({
  id: z.string().uuid("El identificador del evento no es válido.").optional(),
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
  type: z.enum(["INDIVIDUAL", "TEAM"], {
    message: "Tipo de juego no válido.",
  }),
  categoryId: z.string().uuid("La categoría seleccionada no es válida."),
  maxParticipants: z
    .number({
      message: "Debe ser un número.",
    })
    .int("Debe ser un número entero.")
    .min(1, "El cupo mínimo debe ser al menos 1.")
    .nullable()
    .optional(),
  isActive: z.boolean({
    message: "El estado es requerido.",
  }),
  date: z.string().min(1, "La fecha del evento es requerida."),
  registrationDeadline: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),
});

/** Tipo inferido del schema de entrada */
export type EventInput = z.infer<typeof eventSchema>;

export const eventResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(["INDIVIDUAL", "TEAM"]),
  categoryId: z.string().uuid(),
  maxParticipants: z.number().nullable(),
  isActive: z.boolean(),
  date: z.string(),
  registrationDeadline: z.string().nullable(),
});

export type EventResponse = z.infer<typeof eventResponseSchema>;
