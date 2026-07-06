// src/modules/auth/utils/session.ts
// =======================================================
// Helper para obtener el usuario actual desde las cookies (server-only)
// =======================================================
import "server-only";
import { cookies } from "next/headers";
import { verifyJWT, type JWTPayload } from "./jwt";

/**
 * Obtiene el usuario actualmente autenticado desde el token JWT en las cookies.
 * Retorna null si no hay sesión válida o el token expiró.
 *
 * @returns Payload del JWT decodificado o null si no autenticado
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return await verifyJWT(token);
  } catch {
    return null;
  }
}

/**
 * Obtiene el usuario actual y lanza un error si no está autenticado.
 * Usar en Server Actions que requieren autenticación obligatoria.
 *
 * @throws {Error} Si no hay sesión válida
 */
export async function requireCurrentUser(): Promise<JWTPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autorizado. Por favor inicia sesión.");
  }
  return user;
}

/**
 * Verifica que el usuario actual sea administrador.
 * Lanza un error si es coordinador o no está autenticado.
 *
 * @throws {Error} Si no es admin
 */
export async function requireAdmin(): Promise<JWTPayload> {
  const user = await requireCurrentUser();
  if (user.role !== "ADMIN") {
    throw new Error("Acceso denegado. Esta acción requiere permisos de administrador.");
  }
  return user;
}
