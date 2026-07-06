// src/app/admin/registrados/page.tsx
import { db } from "@/lib/db";
import { RegisteredList } from "./RegisteredList";
import { getCurrentUser } from "@/modules/auth/utils/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Participantes Registrados | CI Informática",
  description: "Consulta, filtra y exporta la lista de estudiantes inscritos en los torneos y competencias.",
};

export default async function AdminRegistradosPage() {
  const currentUser = await getCurrentUser();
  const isCoordinator = currentUser?.role === "COORDINATOR";

  // Filtrar inscripciones según el rol: coordinadores solo ven sus eventos asignados
  const registrationWhere = isCoordinator && currentUser
    ? {
        event: {
          encargados: {
            some: { userId: currentUser.userId },
          },
        },
      }
    : {};

  const eventWhere = isCoordinator && currentUser
    ? {
        encargados: {
          some: { userId: currentUser.userId },
        },
      }
    : {};

  // Query registrations and events concurrently for faster load times
  const [registrations, events] = await Promise.all([
    db.registration.findMany({
      where: registrationWhere,
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: { id: true, name: true, description: true },
        },
        participant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            registerCode: true,
          },
        },
        team: {
          select: { id: true, name: true, code: true },
        },
      },
    }),
    db.event.findMany({
      where: eventWhere,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Convert Date objects to strings safely for the Client Component
  const formattedRegistrations = registrations.map((reg) => ({
    id: reg.id,
    confirmationCode: reg.confirmationCode,
    status: reg.status,
    createdAt: reg.createdAt.toISOString(),
    updatedAt: reg.updatedAt.toISOString(),
    eventId: reg.eventId,
    participantId: reg.participantId,
    teamId: reg.teamId,
    event: reg.event,
    participant: reg.participant,
    team: reg.team,
  }));

  return (
    <RegisteredList
      initialRegistrations={formattedRegistrations}
      events={events}
    />
  );
}
