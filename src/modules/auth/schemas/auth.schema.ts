import { z } from "zod";

/**
 * Schema para validar el inicio de sesión.
 */
export const loginSchema = z.object({
  username: z
    .string()
    .email("Debe ser un correo electrónico válido.")
    .min(1, "El correo electrónico es requerido."),
  password: z
    .string()
    .min(1, "La contraseña es requerida."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema para validar la creación de un nuevo usuario (admin o coordinador).
 */
export const createUserSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres.")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios."),
  username: z
    .string()
    .email("Debe ser un correo electrónico válido.")
    .min(1, "El correo electrónico es requerido."),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
  /** Rol del usuario: ADMIN o COORDINATOR */
  role: z.enum(["ADMIN", "COORDINATOR"], {
    message: "El rol seleccionado no es válido.",
  }),
  /** Celular obligatorio para todos los roles */
  phone: z
    .string()
    .min(7, "El número de celular debe tener al menos 7 dígitos.")
    .max(20, "El número de celular no puede superar 20 caracteres."),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Schema para actualizar el perfil propio (nombre y celular).
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres.")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios."),
  phone: z
    .string()
    .min(7, "El número de celular debe tener al menos 7 dígitos.")
    .max(20, "El número de celular no puede superar 20 caracteres."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema para que el administrador actualice la información de cualquier usuario.
 */
export const adminUpdateUserSchema = z.object({
  id: z.string().uuid("ID de usuario inválido."),
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres.")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios."),
  username: z
    .string()
    .email("Debe ser un correo electrónico válido.")
    .min(1, "El correo electrónico es requerido."),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres.")
    .optional()
    .or(z.literal("")),
  role: z.enum(["ADMIN", "COORDINATOR"], {
    message: "El rol seleccionado no es válido.",
  }),
  phone: z
    .string()
    .min(7, "El número de celular debe tener al menos 7 dígitos.")
    .max(20, "El número de celular no puede superar 20 caracteres."),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
