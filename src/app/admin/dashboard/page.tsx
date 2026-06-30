import { db } from "@/lib/db";
import { RefreshButton } from "./RefreshButton";
import Link from "next/link";

// Force Next.js to not cache page statically, ensuring data is fresh on reload/refresh
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel de Administración | CI Informática",
  description: "Monitorea en tiempo real los registros, equipos creados y niveles de ocupación de los torneos activos.",
};

// Helper function to check if an event is team-based using keywords (same logic as main catalog)
const isTeamEvent = (name: string, description?: string | null) => {
  const n = name.toLowerCase();
  const d = (description || "").toLowerCase();
  const teamKeywords = ["5v5", "team", "equipo", "lol", "league of legends", "valorant", "futsal", "fútbol", "futbol"];
  return teamKeywords.some(keyword => n.includes(keyword) || d.includes(keyword));
};

export default async function AdminDashboardPage() {
  const now = new Date();

  // Perform concurrent queries using Prisma to avoid blocking wait times
  const [totalPlayers, totalTeams, activeEvents, recentRegistrations] = await Promise.all([
    db.participant.count(),
    db.team.count(),
    db.event.findMany({
      where: {
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
        maxParticipants: true,
        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.registration.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        confirmationCode: true,
        createdAt: true,
        teamId: true,
        event: {
          select: {
            name: true,
          },
        },
        participant: {
          select: {
            fullName: true,
          },
        },
      },
    }),
  ]);

  // Calculate Global Occupancy
  const eventsWithLimit = activeEvents.filter(e => e.maxParticipants !== null);
  const totalCapacity = eventsWithLimit.reduce((sum, e) => sum + (e.maxParticipants ?? 0), 0);
  const totalOccupied = eventsWithLimit.reduce((sum, e) => sum + e._count.registrations, 0);
  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-zinc-150 flex flex-col items-center pb-safe font-sans selection:bg-violet-650 selection:text-white">
      
      {/* Sticky Premium Header with Navigation for Admin Functions */}
      <header className="sticky top-0 z-40 w-full max-w-lg bg-black/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-violet-500/20">
              AD
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                Admin Panel
              </h1>
              <span className="text-[10px] text-zinc-550 font-medium">
                CI INGENIERÍA INFORMÁTICA
              </span>
            </div>
          </div>
          
          {/* Mobile logout or status button */}
          <div className="sm:hidden">
            <Link
              href="/admin/login"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px] flex items-center px-2"
            >
              Salir
            </Link>
          </div>
        </div>

        {/* Admin Navigation Hub Links (addressing user login/crud context) */}
        <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-zinc-900 pt-2 sm:border-0 sm:pt-0">
          <nav className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 pointer-events-none"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/eventos"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent transition-all min-h-[32px] flex items-center"
            >
              Eventos
            </Link>
            <Link
              href="/admin/registrados"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent transition-all min-h-[32px] flex items-center"
            >
              Registrados
            </Link>
          </nav>
          
          <Link
            href="/admin/login"
            className="hidden sm:inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-450 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 active:scale-95 transition-all min-h-[32px]"
          >
            Cerrar Sesión
          </Link>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="w-full max-w-lg px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
        
        {/* Title Area with Refresh Button */}
        <section className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
              Consola Operativa
            </span>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Panel de Control
            </h2>
          </div>
          <RefreshButton />
        </section>

        {/* 2. Tarjetas de Resumen Rápido (grid-cols-2) */}
        <section className="grid grid-cols-2 gap-4">
          
          {/* Card: Registered Players */}
          <article className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 relative overflow-hidden group hover:border-zinc-800 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-violet-600/5 rounded-full blur-xl" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Jugadores
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight leading-none">
                {totalPlayers}
              </span>
              <span className="text-[10px] font-semibold text-zinc-500">Registrados</span>
            </div>
            <p className="mt-2 text-[10px] text-zinc-550 leading-tight">
              Total de participantes individuales inscritos.
            </p>
          </article>

          {/* Card: Teams Created */}
          <article className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 relative overflow-hidden group hover:border-zinc-800 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-fuchsia-600/5 rounded-full blur-xl" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Equipos
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight leading-none">
                {totalTeams}
              </span>
              <span className="text-[10px] font-semibold text-zinc-500">Creados</span>
            </div>
            <p className="mt-2 text-[10px] text-zinc-550 leading-tight">
              Grupos formados para torneos multijugador.
            </p>
          </article>

          {/* Card: Occupancy (Double Width) */}
          <article className="col-span-2 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 relative overflow-hidden group hover:border-zinc-800 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Ocupación Global
                </span>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-emerald-450 tracking-tight leading-none">
                    {occupancyPercentage}%
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {totalOccupied} / {totalCapacity} cupos ocupados
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            
            {/* Global progress visualizer */}
            <div className="mt-3.5 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </article>
        </section>

        {/* 3. Barras de Progreso por Juego */}
        <section className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-900 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Ratio de Inscripciones por Torneo
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              Monitoreo del nivel de llenado para cada juego activo.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {activeEvents.length > 0 ? (
              activeEvents.map((event) => {
                const isTeam = isTeamEvent(event.name, event.description);
                const current = isTeam ? event._count.teams : event._count.registrations;
                const max = event.maxParticipants;
                
                const percentage = max ? Math.min(100, Math.round((current / max) * 100)) : 0;
                const ratioText = max 
                  ? `${current} / ${max} ${isTeam ? "Equipos" : "Jugadores"}` 
                  : `${current} ${isTeam ? "Equipos" : "Jugadores"}`;

                // Color coding based on status or percentage
                const progressColor = isTeam 
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                  : "bg-gradient-to-r from-emerald-500 to-teal-500";

                return (
                  <div key={event.id} className="space-y-2 border-b border-zinc-950 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-semibold text-zinc-200 line-clamp-1">
                        {event.name}
                      </span>
                      <span className="font-mono text-zinc-400 shrink-0 font-medium bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                        {ratioText}
                      </span>
                    </div>

                    <div className="relative w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden">
                      {max ? (
                        <div
                          className={`${progressColor} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800/40 relative">
                          {/* Pulsing indicator for unlimited events */}
                          <div className="absolute top-0 bottom-0 left-0 bg-violet-600/30 w-1/3 animate-pulse rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-zinc-550 font-medium">
                No hay torneos activos actualmente.
              </div>
            )}
          </div>
        </section>

        {/* 4. Tabla Adaptativa de Registros Recientes */}
        <section className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-900 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Registros Recientes
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              Listado compacto de las últimas 10 inscripciones en tiempo real.
            </p>
          </div>

          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-2.5">Participante</th>
                  <th className="py-2.5">Juego</th>
                  <th className="py-2.5 text-center">Tipo</th>
                  <th className="py-2.5 text-right hidden sm:table-cell">Código</th>
                  <th className="py-2.5 text-right hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs">
                {recentRegistrations.length > 0 ? (
                  recentRegistrations.map((reg) => {
                    const isTeamReg = reg.teamId !== null;
                    return (
                      <tr key={reg.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3 font-semibold text-zinc-250 pr-2">
                          <span className="line-clamp-1">{reg.participant.fullName}</span>
                        </td>
                        <td className="py-3 text-zinc-400 pr-2">
                          <span className="line-clamp-1">{reg.event.name}</span>
                        </td>
                        <td className="py-3 text-center">
                          {isTeamReg ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-violet-650/10 text-violet-400 border border-violet-500/20">
                              Equipo
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Individual
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right font-mono text-zinc-500 hidden sm:table-cell">
                          {reg.confirmationCode}
                        </td>
                        <td className="py-3 text-right text-zinc-500 hidden sm:table-cell whitespace-nowrap">
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
                    <td colSpan={5} className="py-6 text-center text-xs text-zinc-550 font-medium">
                      No hay inscripciones registradas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Floating Action Button for Support / Catalog quick link */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href="/"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-105 active:scale-95 border border-violet-500/30"
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
