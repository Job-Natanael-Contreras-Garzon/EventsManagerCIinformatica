// src/app/admin/eventos/page.tsx
import { db } from "@/lib/db";
import { EventsManager } from "./EventsManager";
import { getCurrentUser } from "@/modules/auth/utils/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestión de Torneos | CI Informática",
  description: "Crea, edita y administra los torneos y competencias activas de la Semana Universitaria.",
};

export default async function AdminEventosPage() {
  const currentUser = await getCurrentUser();
  const isCoordinator = currentUser?.role === "COORDINATOR";

  // Construir filtros según el rol del usuario
  const eventWhere = isCoordinator && currentUser
    ? {
        encargados: {
          some: { userId: currentUser.userId },
        },
      }
    : {};

  // Query concurrent de eventos, categorías y usuarios del sistema
  const [events, categories, systemUsers] = await Promise.all([
    db.event.findMany({
      where: eventWhere,
      orderBy: { name: "asc" },
      include: {
        category: { select: { id: true, name: true } },
        encargados: {
          select: {
            id: true,
            name: true,
            phone: true,
            whatsappUrl: true,
            userId: true,
          },
        },
        _count: {
          select: { registrations: true, teams: true },
        },
      },
    }),
    db.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { events: true } },
      },
    }),
    // Cargar todos los usuarios (admins + coordinadores) para selector de encargados
    db.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, username: true, phone: true, role: true },
    }),
  ]);

  return (
    <EventsManager
      initialEvents={events}
      categories={categories}
      systemUsers={systemUsers}
      currentUserId={currentUser?.userId}
      currentUserRole={currentUser?.role as "ADMIN" | "COORDINATOR"}
    />
  );
}
