import { db } from "@/lib/db";
import { RefreshButton } from "./RefreshButton";
import { AdminHeader } from "@/components/admin/AdminHeader";
import Link from "next/link";
import { getCurrentUser } from "@/modules/auth/utils/session";
import { getSystemConfig } from "@/modules/system-config/actions";
import { SystemConfigEditor } from "./SystemConfigEditor";


// Force Next.js to not cache page statically, ensuring data is fresh on reload/refresh
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel de Administración | CI Informática",
  description: "Monitorea en tiempo real los registros, equipos creados y niveles de ocupación de los torneos activos.",
};



export default async function AdminDashboardPage() {
  const now = new Date();
  const currentUser = await getCurrentUser();
  const isCoordinator = currentUser?.role === "COORDINATOR";

  // Filtro base para coordinadores: solo sus eventos asignados
  const eventWhere = isCoordinator && currentUser
    ? { encargados: { some: { userId: currentUser.userId } } }
    : {};

  // Perform concurrent queries using Prisma to avoid blocking wait times
  const [totalPlayers, totalTeams, activeEvents, recentRegistrations, systemConfig] = await Promise.all([
    // Si es coordinador, contar solo participantes de sus eventos
    isCoordinator && currentUser
      ? db.participant.count({
          where: {
            registrations: {
              some: {
                event: {
                  encargados: { some: { userId: currentUser.userId } },
                },
              },
            },
          },
        })
      : db.participant.count(),

    isCoordinator && currentUser
      ? db.team.count({
          where: {
            event: {
              encargados: { some: { userId: currentUser.userId } },
            },
          },
        })
      : db.team.count(),

    db.event.findMany({
      where: {
        ...eventWhere,
        isActive: true,
        OR: [
          { registrationDeadline: null },
          { registrationDeadline: { gte: now } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        maxParticipants: true,
        _count: { select: { registrations: true, teams: true } },
      },
      orderBy: { name: "asc" },
    }),

    db.registration.findMany({
      take: 10,
      where: isCoordinator && currentUser
        ? {
            event: {
              encargados: { some: { userId: currentUser.userId } },
            },
          }
        : {},
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        confirmationCode: true,
        createdAt: true,
        teamId: true,
        event: { select: { name: true } },
        participant: { select: { fullName: true } },
      },
    }),

    // Config del sistema solo para admins (para mostrar el editor)
    !isCoordinator ? getSystemConfig() : null,
  ]);

  // Calculate Global Occupancy
  const eventsWithLimit = activeEvents.filter(e => e.maxParticipants !== null);
  const totalCapacity = eventsWithLimit.reduce((sum, e) => sum + (e.maxParticipants ?? 0), 0);
  const totalOccupied = eventsWithLimit.reduce((sum, e) => sum + e._count.registrations, 0);
  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans selection:bg-brand-sky selection:text-brand-navy">
      
      {/* Shared Admin Header with hamburger menu for mobile */}
      <AdminHeader />

      {/* Main Admin Content Container */}
      <main className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
        
        {/* Title Area with Refresh Button */}
        <section className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest">
              {isCoordinator ? "Vista de Coordinador" : "Consola Operativa"}
            </span>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Panel de Control
            </h2>
            {isCoordinator && (
              <p className="text-[10px] text-brand-sky/50 mt-0.5">
                Mostrando métricas de tus eventos asignados
              </p>
            )}
          </div>
          <RefreshButton />
        </section>

        {/* 2. Tarjetas de Resumen Rápido (grid-cols-2) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card: Registered Players */}
          <article className="p-4 rounded-2xl bg-brand-dark/45 border border-brand-blue/30 relative overflow-hidden group hover:border-brand-blue/50 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-brand-sky/5 rounded-full blur-xl" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/60">
              Jugadores
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight leading-none">
                {totalPlayers}
              </span>
              <span className="text-[10px] font-semibold text-brand-sky/50">Registrados</span>
            </div>
            <p className="mt-2 text-[10px] text-brand-light-gray/60 leading-tight">
              {isCoordinator ? "Participantes en tus eventos." : "Total de participantes individuales inscritos."}
            </p>
          </article>

          {/* Card: Teams Created */}
          <article className="p-4 rounded-2xl bg-brand-dark/45 border border-brand-blue/30 relative overflow-hidden group hover:border-brand-blue/50 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-brand-sky/5 rounded-full blur-xl" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/60">
              Equipos
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight leading-none">
                {totalTeams}
              </span>
              <span className="text-[10px] font-semibold text-brand-sky/50">Creados</span>
            </div>
            <p className="mt-2 text-[10px] text-brand-light-gray/60 leading-tight">
              {isCoordinator ? "Equipos en tus eventos." : "Grupos formados para torneos multijugador."}
            </p>
          </article>

          {/* Card: Occupancy (Double Width) */}
          <article className="col-span-2 p-4 rounded-2xl bg-brand-dark/45 border border-brand-blue/30 relative overflow-hidden group hover:border-brand-blue/50 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-brand-sky/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/60">
                  Ocupación Global
                </span>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-brand-sky tracking-tight leading-none">
                    {occupancyPercentage}%
                  </span>
                  <span className="text-[11px] font-semibold text-brand-light-gray/80">
                    {totalOccupied} / {totalCapacity} cupos ocupados
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-sky/10 border border-brand-sky/20 flex items-center justify-center text-brand-sky font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            
            {/* Global progress visualizer */}
            <div className="mt-3.5 w-full bg-brand-navy h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-sky h-full rounded-full transition-all duration-500"
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </article>
        </section>

        {/* 3 & 4. Grid responsiva lado a lado en pantallas grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* 3. Barras de Progreso por Juego */}
          <section className="p-5 rounded-2xl bg-brand-dark/35 border border-brand-blue/30 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Ratio de Inscripciones por Torneo
              </h3>
              <p className="text-xs text-brand-sky/60 mt-0.5 leading-relaxed">
                Monitoreo del nivel de llenado para cada juego activo.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {activeEvents.length > 0 ? (
                activeEvents.map((event) => {
                  const isTeam = event.type === "TEAM";
                  const current = isTeam ? event._count.teams : event._count.registrations;
                  const max = event.maxParticipants;
                  
                  const percentage = max ? Math.min(100, Math.round((current / max) * 100)) : 0;
                  const ratioText = max 
                    ? `${current} / ${max} ${isTeam ? "Equipos" : "Jugadores"}` 
                    : `${current} ${isTeam ? "Equipos" : "Jugadores"}`;

                  // Color coding based on status or percentage
                  const progressColor = isTeam 
                    ? "bg-gradient-to-r from-brand-blue to-brand-sky" 
                    : "bg-gradient-to-r from-brand-sky to-white";

                  return (
                    <div key={event.id} className="space-y-2 border-b border-brand-blue/20 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-semibold text-brand-light-gray line-clamp-1">
                          {event.name}
                        </span>
                        <span className="font-mono text-brand-light-gray/80 shrink-0 font-medium bg-brand-navy/60 px-2 py-0.5 rounded-md border border-brand-blue/30">
                          {ratioText}
                        </span>
                      </div>

                      <div className="relative w-full bg-brand-navy h-2.5 rounded-full overflow-hidden">
                        {max ? (
                          <div
                            className={`${progressColor} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-navy/40 relative">
                            {/* Pulsing indicator for unlimited events */}
                            <div className="absolute top-0 bottom-0 left-0 bg-brand-sky/30 w-1/3 animate-pulse rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-brand-sky/50 font-medium">
                  No hay torneos activos actualmente.
                </div>
              )}
            </div>
          </section>

          {/* 4. Tabla Adaptativa de Registros Recientes */}
          <section className="p-5 rounded-2xl bg-brand-dark/35 border border-brand-blue/30 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Registros Recientes
              </h3>
              <p className="text-xs text-brand-sky/60 mt-0.5 leading-relaxed">
                Listado compacto de las últimas 10 inscripciones en tiempo real.
              </p>
            </div>

            <div className="w-full overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-blue/20 text-[10px] font-bold uppercase tracking-wider text-brand-sky/50">
                    <th className="py-2.5">Participante</th>
                    <th className="py-2.5">Juego</th>
                    <th className="py-2.5 text-center">Tipo</th>
                    <th className="py-2.5 text-right hidden sm:table-cell">Código</th>
                    <th className="py-2.5 text-right hidden sm:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-blue/15 text-xs">
                  {recentRegistrations.length > 0 ? (
                    recentRegistrations.map((reg) => {
                      const isTeamReg = reg.teamId !== null;
                      return (
                        <tr key={reg.id} className="hover:bg-brand-blue/15 transition-colors">
                          <td className="py-3 font-semibold text-brand-light-gray pr-2">
                            <span className="line-clamp-1">{reg.participant.fullName}</span>
                          </td>
                          <td className="py-3 text-brand-light-gray/80 pr-2">
                            <span className="line-clamp-1">{reg.event.name}</span>
                          </td>
                          <td className="py-3 text-center">
                            {isTeamReg ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-brand-sky/15 text-brand-sky border border-brand-sky/25">
                                Equipo
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Individual
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right font-mono text-brand-sky/60 hidden sm:table-cell">
                            {reg.confirmationCode}
                          </td>
                          <td className="py-3 text-right text-brand-sky/60 hidden sm:table-cell whitespace-nowrap">
                            {new Date(reg.createdAt).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-brand-sky/50 font-medium">
                        No hay inscripciones registradas todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* 5. Editor de Cabecera del Catálogo Público — Solo para Admin */}
        {!isCoordinator && systemConfig && (
          <SystemConfigEditor initialConfig={systemConfig} />
        )}

      </main>

      {/* Floating Action Button for Support / Catalog quick link */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href="/"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-brand-blue to-brand-sky text-brand-navy shadow-lg shadow-brand-sky/20 transition-all hover:scale-105 active:scale-95 border border-brand-sky/30 font-bold"
          title="Ver catálogo público"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
      </div>

    </div>
  );
}
