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
  maxTeamMembers: z
    .number({
      message: "Debe ser un número.",
    })
    .int("Debe ser un número entero.")
    .min(1, "El número de integrantes mínimo debe ser al menos 1.")
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
  encargados: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, "El nombre del encargado es requerido.")
          .max(100, "El nombre no puede superar 100 caracteres."),
        phone: z
          .string()
          .min(1, "El celular del encargado es requerido.")
          .max(20, "El celular no puede superar 20 caracteres."),
      })
    )
    .min(1, "Debe haber al menos un encargado."),
  imageBase64: z.string().optional().nullable(),
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
  type: z.enum(["INDIVIDUAL", "TEAM"]),
  categoryId: z.string().uuid(),
  maxParticipants: z.number().nullable(),
  isActive: z.boolean(),
  date: z.string(),
  registrationDeadline: z.string().nullable(),
});

export type EventResponse = z.infer<typeof eventResponseSchema>;
