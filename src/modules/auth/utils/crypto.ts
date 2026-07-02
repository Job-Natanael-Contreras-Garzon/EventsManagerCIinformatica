import "server-only";
import crypto from "crypto";

/**
 * Hashea una contraseña usando PBKDF2 nativo de Node.js con un salt aleatorio.
 * @param password Contraseña en texto plano
 * @returns Hash formateado como "salt:hash_hex"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifica si una contraseña coincide con el hash almacenado en la base de datos.
 * @param password Contraseña en texto plano
 * @param stored Hash almacenado en formato "salt:hash_hex"
 * @returns true si coinciden, false de lo contrario
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split(":");
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === verifyHash;
  } catch (error) {
    return false;
  }
}
