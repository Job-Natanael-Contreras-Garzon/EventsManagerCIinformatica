// src/app/admin/usuarios/page.tsx
import { getAllAdminUsers } from "@/modules/auth/services/auth.service";
import { UsersManager } from "./UsersManager";
import { getCurrentUser } from "@/modules/auth/utils/session";

// Force Next.js to run this page dynamically, retrieving fresh data on load
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestión de Usuarios | CI Informática",
  description: "Registra y administra las cuentas de administradores y coordinadores del sistema.",
};

export default async function AdminUsuariosPage() {
  const [users, currentUser] = await Promise.all([
    getAllAdminUsers(),
    getCurrentUser(),
  ]);

  return (
    <UsersManager
      initialUsers={users}
      currentUserRole={(currentUser?.role as "ADMIN" | "COORDINATOR") ?? "ADMIN"}
      currentUserId={currentUser?.userId ?? ""}
    />
  );
}
