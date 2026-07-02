import "server-only";
import { db } from "@/lib/db";
import { hashPassword } from "../utils/crypto";

export interface UserDTO {
  id: string;
  name: string;
  username: string;
  createdAt: Date;
}

/**
 * Busca un usuario por su nombre de usuario (correo).
 */
export async function getUserByUsername(username: string) {
  return await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      password: true,
    },
  });
}

/**
 * Registra un nuevo administrador en la base de datos.
 */
export async function createAdminUser(name: string, username: string, passwordHash: string): Promise<UserDTO> {
  const newUser = await db.user.create({
    data: {
      name,
      username,
      password: passwordHash,
    },
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true,
    },
  });

  return newUser;
}

/**
 * Retorna todos los usuarios administradores.
 */
export async function getAllAdminUsers(): Promise<Omit<UserDTO, "createdAt">[]> {
  return await db.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Asegura que el administrador inicial (Job Contreras) exista en la base de datos.
 * Si no existe, lo crea automáticamente.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  const defaultEmail = "contrerasjob123@gmail.com";
  const defaultPassword = "contreras123";
  const defaultName = "job contreras";

  const adminExists = await db.user.findUnique({
    where: { username: defaultEmail },
    select: { id: true },
  });

  if (!adminExists) {
    const passwordHash = hashPassword(defaultPassword);
    await db.user.create({
      data: {
        name: defaultName,
        username: defaultEmail,
        password: passwordHash,
      },
    });
    console.log(`[Auth Service] Creado administrador por defecto: ${defaultEmail}`);
  }
}
