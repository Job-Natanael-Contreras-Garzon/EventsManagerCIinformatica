"use server";

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loginSchema, createUserSchema, updateProfileSchema, adminUpdateUserSchema, type CreateUserInput, type UpdateProfileInput, type AdminUpdateUserInput } from "../schemas/auth.schema";
import { getUserByUsername, createUser, ensureDefaultAdmin, deleteAdminUser, countAdminUsers, updateUserProfile, updateUserByAdmin } from "../services/auth.service";
import { verifyPassword, hashPassword } from "../utils/crypto";
import { signJWT, verifyJWT } from "../utils/jwt";
import { getCurrentUser } from "../utils/session";
import type { ActionResult } from "@/modules/registration/types/action-result.types";

/**
 * Server Action: Inicia sesión, genera token JWT con rol y escribe la cookie.
 * Autocrea el administrador por defecto si no existe al intentar loguearse.
 */
export async function loginAction(rawInput: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Datos de formulario inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { username, password } = parsed.data;

  try {
    // Si intenta iniciar con el usuario inicial hardcodeado, asegurar su existencia en DB
    if (username === "contrerasjob123@gmail.com") {
      await ensureDefaultAdmin();
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return {
        success: false,
        error: "Usuario o contraseña incorrectos.",
      };
    }

    const isPasswordCorrect = verifyPassword(password, user.password);
    if (!isPasswordCorrect) {
      return {
        success: false,
        error: "Usuario o contraseña incorrectos.",
      };
    }

    // Firmar Token JWT con rol incluido
    const token = await signJWT({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role as "ADMIN" | "COORDINATOR",
    });

    // Guardar token en las cookies del cliente
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 día
      path: "/",
    });
  } catch (error) {
    console.error("[Auth Action] Error en loginAction:", error);
    return {
      success: false,
      error: "Ocurrió un error interno en el servidor.",
    };
  }

  // Redirigir al panel de control (fuera del try-catch para no interferir con redirect de Next.js)
  redirect("/admin/dashboard");
}

/**
 * Server Action: Cierra la sesión activa borrando la cookie del token.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/admin/login");
}

/**
 * Server Action: Crea un nuevo usuario (admin o coordinador) en el sistema.
 * Solo accesible por administradores.
 */
export async function createUserAction(rawInput: unknown): Promise<ActionResult<{ username: string }>> {
  // Verificar que el usuario actual sea admin
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return {
      success: false,
      error: "Acceso denegado. Solo los administradores pueden crear usuarios.",
    };
  }

  const parsed = createUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Los datos del usuario son inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, username, password, role, phone } = parsed.data;

  try {
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return {
        success: false,
        error: "El correo electrónico ya está registrado.",
        fieldErrors: {
          username: ["Este correo ya está registrado."],
        },
      };
    }

    const hashedPassword = hashPassword(password);
    await createUser(name, username, hashedPassword, role, phone);

    // Revalidar la vista de lista de usuarios para mostrar el nuevo
    revalidatePath("/admin/usuarios");

    return {
      success: true,
      data: { username },
    };
  } catch (error) {
    console.error("[Auth Action] Error en createUserAction:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al registrar el usuario.",
    };
  }
}

/**
 * Server Action: Elimina un usuario por su ID.
 * Implementa validaciones de seguridad:
 * - El usuario no puede eliminarse a sí mismo.
 * - Debe haber al menos un administrador en el sistema.
 * - Solo admins pueden eliminar usuarios.
 */
export async function deleteUserAction(userIdToDelete: string): Promise<ActionResult> {
  try {
    // 1. Obtener la sesión actual del token JWT
    const currentSession = await getCurrentUser();
    if (!currentSession) {
      return {
        success: false,
        error: "Acción no autorizada. Por favor inicia sesión.",
      };
    }

    if (currentSession.role !== "ADMIN") {
      return {
        success: false,
        error: "Acceso denegado. Solo los administradores pueden eliminar usuarios.",
      };
    }

    // 2. Comprobar que no se intente eliminar a sí mismo
    if (currentSession.userId === userIdToDelete) {
      return {
        success: false,
        error: "No puedes eliminar tu propia cuenta mientras estás en sesión.",
      };
    }

    // 3. Comprobar que no sea el único administrador del sistema
    const adminCount = await countAdminUsers();
    if (adminCount <= 1) {
      return {
        success: false,
        error: "No se puede eliminar el último usuario del sistema.",
      };
    }

    // 4. Proceder con la eliminación
    await deleteAdminUser(userIdToDelete);

    // Revalidar la ruta de usuarios para actualizar la lista
    revalidatePath("/admin/usuarios");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("[Auth Action] Error en deleteUserAction:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al eliminar el usuario.",
    };
  }
}

/**
 * Server Action: Actualiza el perfil propio del usuario autenticado (nombre y celular).
 * Accesible por cualquier rol autenticado.
 */
export async function updateOwnProfileAction(rawInput: unknown): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      error: "Acción no autorizada. Por favor inicia sesión.",
    };
  }

  const parsed = updateProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Los datos del perfil son inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateUserProfile(currentUser.userId, parsed.data.name, parsed.data.phone);
    revalidatePath("/admin/usuarios");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[Auth Action] Error en updateOwnProfileAction:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al actualizar el perfil.",
    };
  }
}

/**
 * Server Action: Permite que el administrador actualice la información de cualquier usuario del sistema.
 */
export async function updateUserByAdminAction(rawInput: unknown): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return {
      success: false,
      error: "Acceso denegado. Solo los administradores pueden editar usuarios.",
    };
  }

  const parsed = adminUpdateUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Los datos de edición son inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, name, username, phone, role, password } = parsed.data;

  try {
    // Verificar si el correo ya existe en otro usuario
    const existing = await getUserByUsername(username);
    if (existing && existing.id !== id) {
      return {
        success: false,
        error: "El correo electrónico ya está en uso por otro usuario.",
        fieldErrors: {
          username: ["Este correo ya está registrado por otro usuario."],
        },
      };
    }

    await updateUserByAdmin(id, {
      name,
      username,
      phone,
      role,
      password: password || undefined,
    });

    revalidatePath("/admin/usuarios");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[Auth Action] Error en updateUserByAdminAction:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al actualizar el usuario.",
    };
  }
}
