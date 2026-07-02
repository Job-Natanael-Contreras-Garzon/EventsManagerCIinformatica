// src/app/admin/eventos/page.tsx
import { db } from "@/lib/db";
import { EventsManager } from "./EventsManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestión de Torneos | CI Informática",
  description: "Crea, edita y administra los torneos y competencias activas de la Semana Universitaria.",
};

export default async function AdminEventosPage() {
  // Query both events and categories concurrently to optimize page load speeds
  const [events, categories] = await Promise.all([
    db.event.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        encargados: {
          select: {
            id: true,
            name: true,
            phone: true,
            whatsappUrl: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
    }),
    db.category.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            events: true,
          },
        },
      },
    }),
  ]);

  return <EventsManager initialEvents={events} categories={categories} />;
}
