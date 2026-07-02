"use server";

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loginSchema, createUserSchema } from "../schemas/auth.schema";
import { getUserByUsername, createAdminUser, ensureDefaultAdmin } from "../services/auth.service";
import { verifyPassword, hashPassword } from "../utils/crypto";
import { signJWT } from "../utils/jwt";
import type { ActionResult } from "@/modules/registration/types/action-result.types";

/**
 * Server Action: Inicia sesión de administrador, genera token JWT y escribe la cookie.
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

    // Firmar Token JWT
    const token = await signJWT({
      userId: user.id,
      username: user.username,
      name: user.name,
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
 * Server Action: Crea un nuevo usuario administrador en el sistema.
 */
export async function createUserAction(rawInput: unknown): Promise<ActionResult<{ username: string }>> {
  const parsed = createUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Los datos del usuario son inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, username, password } = parsed.data;

  try {
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return {
        success: false,
        error: "El correo electrónico ya está registrado por otro administrador.",
        fieldErrors: {
          username: ["Este correo ya está registrado."],
        },
      };
    }

    const hashedPassword = hashPassword(password);
    await createAdminUser(name, username, hashedPassword);

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
      error: "Ocurrió un error inesperado al registrar el administrador.",
    };
  }
}
