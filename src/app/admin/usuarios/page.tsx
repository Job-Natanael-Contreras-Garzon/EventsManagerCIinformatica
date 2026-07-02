import { getAllAdminUsers } from "@/modules/auth/services/auth.service";
import { UsersManager } from "./UsersManager";

// Force Next.js to run this page dynamically, retrieving fresh data on load
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestión de Usuarios | CI Informática",
  description: "Registra y administra las cuentas de administradores del sistema.",
};

export default async function AdminUsuariosPage() {
  const users = await getAllAdminUsers();
  return <UsersManager initialUsers={users} />;
}
