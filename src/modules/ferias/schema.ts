// src/modules/ferias/schema.ts
import { z } from "zod";

export const feriaSchema = z.object({
  id: z
    .string()
    .uuid("El identificador de la feria no es válido.")
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
  cost: z
    .string()
    .max(50, "El costo no puede superar 50 caracteres.")
    .optional()
    .default("Gratuito")
    .or(z.literal("")),
  dates: z
    .string()
    .min(1, "La fecha de la feria es requerida.")
    .max(100, "La fecha no puede superar 100 caracteres."),
  registrationUrl: z
    .string()
    .url("El enlace de inscripción no es válido (debe empezar con http:// o https://).")
    .optional()
    .nullable()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
  encargadoUserIds: z
    .array(z.string().uuid())
    .optional()
    .default([]),
  imageBase64: z.string().optional().nullable(),
});

export type FeriaInput = z.infer<typeof feriaSchema>;

export const feriaResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  cost: z.string(),
  dates: z.string(),
  registrationUrl: z.string().nullable(),
  isActive: z.boolean(),
});

export type FeriaResponse = z.infer<typeof feriaResponseSchema>;
