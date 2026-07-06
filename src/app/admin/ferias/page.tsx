// src/app/admin/ferias/page.tsx
import { db } from "@/lib/db";
import { FeriasManager } from "./FeriasManager";
import { getCurrentUser } from "@/modules/auth/utils/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestión de Ferias y Emprendimientos | CI Informática",
  description: "Crea, edita y administra los emprendimientos y ferias de la Semana Universitaria.",
};

export default async function AdminFeriasPage() {
  const currentUser = await getCurrentUser();
  const isCoordinator = currentUser?.role === "COORDINATOR";

  const feriaWhere = isCoordinator && currentUser
    ? {
        encargados: {
          some: { userId: currentUser.userId },
        },
      }
    : {};

  const [ferias, systemUsers] = await Promise.all([
    db.feria.findMany({
      where: feriaWhere,
      orderBy: { name: "asc" },
      include: {
        encargados: {
          select: {
            id: true,
            name: true,
            phone: true,
            whatsappUrl: true,
            userId: true,
          },
        },
      },
    }),
    db.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, username: true, phone: true, role: true },
    }),
  ]);

  return (
    <FeriasManager
      initialFerias={ferias}
      systemUsers={systemUsers}
      currentUserId={currentUser?.userId}
      currentUserRole={currentUser?.role as "ADMIN" | "COORDINATOR"}
    />
  );
}
