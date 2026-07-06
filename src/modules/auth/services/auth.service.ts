import "server-only";
import { db } from "@/lib/db";
import { hashPassword } from "../utils/crypto";

export interface UserDTO {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "COORDINATOR";
  phone: string;
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
      role: true,
      phone: true,
    },
  });
}

/**
 * Registra un nuevo usuario en la base de datos (admin o coordinador).
 */
export async function createUser(
  name: string,
  username: string,
  passwordHash: string,
  role: "ADMIN" | "COORDINATOR",
  phone: string
): Promise<UserDTO> {
  const newUser = await db.user.create({
    data: {
      name,
      username,
      password: passwordHash,
      role,
      phone,
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      phone: true,
      createdAt: true,
    },
  });

  return newUser as UserDTO;
}

/**
 * Retorna todos los usuarios del sistema.
 */
export async function getAllUsers(): Promise<Omit<UserDTO, "createdAt">[]> {
  return await db.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      phone: true,
    },
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
  }) as Omit<UserDTO, "createdAt">[];
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
        role: "ADMIN",
        phone: "",
      },
    });
    console.log(`[Auth Service] Creado administrador por defecto: ${defaultEmail}`);
  }
}

/**
 * Elimina un usuario por su ID de base de datos.
 */
export async function deleteAdminUser(id: string): Promise<void> {
  await db.user.delete({
    where: { id },
  });
}

/**
 * Cuenta la cantidad total de usuarios registrados.
 */
export async function countAdminUsers(): Promise<number> {
  return await db.user.count();
}

/**
 * Actualiza el perfil propio del usuario (nombre y celular).
 */
export async function updateUserProfile(
  id: string,
  name: string,
  phone: string
): Promise<void> {
  await db.user.update({
    where: { id },
    data: { name, phone },
  });
}

// Alias para compatibilidad con código existente
export const createAdminUser = (
  name: string,
  username: string,
  passwordHash: string
) => createUser(name, username, passwordHash, "ADMIN", "");

// Alias para compatibilidad con código existente
export const getAllAdminUsers = getAllUsers;

/**
 * Actualiza la información completa de cualquier usuario (para el administrador).
 */
export async function updateUserByAdmin(
  id: string,
  data: {
    name: string;
    username: string;
    phone: string;
    role: "ADMIN" | "COORDINATOR";
    password?: string;
  }
): Promise<void> {
  const updateData: any = {
    name: data.name,
    username: data.username,
    phone: data.phone,
    role: data.role,
  };

  if (data.password) {
    updateData.password = hashPassword(data.password);
  }

  await db.user.update({
    where: { id },
    data: updateData,
  });
}
