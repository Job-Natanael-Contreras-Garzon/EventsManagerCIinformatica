// src/lib/db.ts
// =======================================================
// Singleton de PrismaClient — Única fuente de acceso a DB
// ⚠️ SERVER-ONLY: Nunca importar desde "use client"
// =======================================================
import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient para prevenir múltiples conexiones
 * en entornos de desarrollo con Hot Module Replacement (HMR).
 *
 * En producción: una sola instancia por proceso de Node.js.
 * En desarrollo: reutiliza la instancia global entre recargas de módulo.
 *
 * DATABASE_URL es leída automáticamente desde process.env.
 * Nunca pasar DATABASE_URL como argumento explícito.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
