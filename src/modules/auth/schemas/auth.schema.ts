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
 * Schema para validar la creación de un nuevo usuario administrador.
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
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
