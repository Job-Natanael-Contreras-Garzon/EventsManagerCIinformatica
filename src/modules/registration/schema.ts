// src/modules/registration/schema.ts
// =========================================================
// Schema Zod isomórfico para el módulo de registro.
// ⚠️ Este archivo NO tiene "use server" / "use client".
//    Se ejecuta tanto en el cliente como en el servidor.
// =========================================================
import { z } from "zod";

/** Regex para números de celular en Bolivia (8 dígitos empezando con 6 o 7) */
const BOLIVIA_PHONE_REGEX = /^(?:\+?591)?[67]\d{7}$/;

/**
 * Schema canónico para la inscripción de participantes a eventos (individual o grupal).
 *
 * Validaciones:
 * - fullName: solo letras y espacios (incluye acentos y ñ).
 * - email: formato de correo válido y seguro.
 * - registerCode: código universitario alfanumérico y guiones (6 a 20 caracteres).
 * - phone: celular de Bolivia (remueve espacios/guiones y valida 8 dígitos iniciados con 6 o 7).
 * - eventId: UUID del evento seleccionado.
 * - registrationType: 'individual', 'create_team' (crear equipo) o 'join_team' (unirse a equipo).
 * - teamName: obligatorio si registrationType es 'create_team'.
 * - teamCode: obligatorio (6 alfanuméricos en mayúsculas) si registrationType es 'join_team'.
 * - acceptedTerms: debe ser literal `true`.
 */
export const registrationSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "El nombre debe tener al menos 3 caracteres.")
      .max(100, "El nombre no puede superar 100 caracteres.")
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        "Solo se permiten letras y espacios."
      ),

    email: z
      .string()
      .email("Debe ser un correo electrónico válido.")
      .max(254, "El correo no puede superar 254 caracteres."),

    registerCode: z
      .string()
      .min(6, "El código universitario debe tener al menos 6 caracteres.")
      .max(20, "El código universitario no puede superar 20 caracteres.")
      .regex(
        /^[0-9A-Za-z\-]+$/,
        "El código universitario solo puede contener letras, números y guiones."
      ),

    phone: z
      .string()
      .transform((val) => val.replace(/[\s\-\(\)]/g, ""))
      .refine((val) => BOLIVIA_PHONE_REGEX.test(val), {
        message: "Número de celular inválido. Debe ser de Bolivia (8 dígitos y empezar con 6 o 7, ej: 70712345).",
      }),

    eventId: z.string().uuid("El identificador del evento no es válido."),

    registrationType: z.enum(["individual", "create_team", "join_team"], {
      message: "Tipo de registro no válido.",
    }),

    teamName: z
      .string()
      .max(50, "El nombre del equipo no puede superar 50 caracteres.")
      .optional()
      .or(z.literal("")),

    teamCode: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((val) => val?.toUpperCase()),

    acceptedTerms: z.literal(true, {
      message: "Debe aceptar los términos y condiciones.",
    }),
  })
  .superRefine((data, ctx) => {
    // Si crea un equipo, el nombre del equipo es obligatorio
    if (data.registrationType === "create_team") {
      if (!data.teamName || data.teamName.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El nombre del equipo es requerido y debe tener al menos 3 caracteres.",
          path: ["teamName"],
        });
      }
    }

    // Si se une a un equipo, el código es obligatorio y debe tener 6 caracteres
    if (data.registrationType === "join_team") {
      if (!data.teamCode || !/^[A-Z0-9]{6}$/.test(data.teamCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El código de equipo es requerido y debe tener exactamente 6 caracteres alfanuméricos.",
          path: ["teamCode"],
        });
      }
    }
  });

/** Tipo inferido del schema de entrada */
export type RegistrationInput = z.infer<typeof registrationSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Schema de respuesta segura
// Nunca exponer IDs internos de la DB directamente al cliente.
// ─────────────────────────────────────────────────────────────────────────

export const registrationResponseSchema = z.object({
  confirmationCode: z.string(),
  participantName: z.string(),
  eventName: z.string(),
  registeredAt: z.string().datetime(),
  registrationType: z.enum(["individual", "create_team", "join_team"]),
  teamCode: z.string().optional(),
  teamName: z.string().optional(),
});

/** Tipo inferido de la respuesta de registro exitoso */
export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;
