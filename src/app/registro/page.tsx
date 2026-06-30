// src/app/registro/page.tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { RegistrationForm } from "@/modules/registration/components/RegistrationForm";

export const metadata = {
  title: "Inscripción a Torneos | CI Informática",
  description: "Formulario de registro para los torneos y actividades de la Semana Universitaria.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Keyword-based check to identify if an event is team-based (TEAM) or individual (INDIVIDUAL)
function getRegistrationMode(event: { name: string; description: string | null }): "INDIVIDUAL" | "TEAM" {
  const name = event.name.toLowerCase();
  const desc = (event.description || "").toLowerCase();
  const teamKeywords = ["5v5", "team", "equipo", "lol", "league of legends", "valorant", "futsal", "fútbol", "futbol"];
  const isTeam = teamKeywords.some((keyword) => name.includes(keyword) || desc.includes(keyword));
  return isTeam ? "TEAM" : "INDIVIDUAL";
}

export default async function RegistroPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const gameId = typeof resolvedSearchParams.gameId === "string" ? resolvedSearchParams.gameId : undefined;

  let event = null;
  let isInvalidUuid = false;

  if (gameId) {
    try {
      event = await db.event.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          registrationDeadline: true,
          maxParticipants: true,
          category: {
            select: {
              name: true,
            },
          },
          _count: {
            select: { registrations: true },
          },
        },
      });
    } catch (e) {
      isInvalidUuid = true;
    }
  }

  // Handle case: Event not found or missing search param
  if (!gameId || !event || isInvalidUuid) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-4 pb-safe selection:bg-violet-600 selection:text-white">
        <div className="w-full max-w-md text-center p-8 bg-zinc-950/60 border border-zinc-900 rounded-2xl shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Juego No Encontrado</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              No hemos podido identificar el torneo al cual deseas inscribirte. Por favor, regresa al catálogo principal y selecciona tu juego.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="flex items-center justify-center w-full min-h-[48px] rounded-xl bg-zinc-900 hover:bg-zinc-855 text-zinc-200 border border-zinc-800 text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
            >
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate event rules / status
  const now = new Date();
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const isDeadlinePassed = deadline ? deadline < now : false;
  const isFull = event.maxParticipants !== null && event._count.registrations >= event.maxParticipants;
  const isOpen = event.isActive && !isDeadlinePassed && !isFull;
  const registrationMode = getRegistrationMode(event);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center py-6 pb-24 px-4 selection:bg-violet-600 selection:text-white">
      
      {/* Header back button */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-all group min-h-[44px] min-w-[44px]"
        >
          <svg
            className="w-5 h-5 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Volver</span>
        </Link>
        <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest bg-zinc-900/60 border border-zinc-850 px-2.5 py-1 rounded-lg">
          {registrationMode === "TEAM" ? "Torneo en Equipo" : "Torneo Individual"}
        </span>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-md flex flex-col gap-6">
        
        {/* Game Title Summary Card */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-gradient-to-b from-zinc-900/40 to-zinc-950/10 p-5">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl" />
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
              {event.category?.name || "Semana Universitaria"}
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white leading-tight">
              {event.name}
            </h1>
            {event.description && (
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                {event.description}
              </p>
            )}
          </div>
        </section>

        {/* Registration Form / Closed State Checker */}
        <section>
          {isOpen ? (
            <RegistrationForm
              eventId={event.id}
              eventName={event.name}
              registrationMode={registrationMode}
            />
          ) : (
            <div className="w-full p-6 text-center bg-zinc-950/60 border border-zinc-900 rounded-2xl shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Inscripciones Cerradas</h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
                  {isDeadlinePassed
                    ? "El plazo límite de registro para este torneo ha expirado."
                    : isFull
                    ? "El cupo máximo de participantes para este torneo ha sido completado."
                    : "El registro para este torneo no se encuentra disponible actualmente."}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/"
                  className="flex items-center justify-center w-full min-h-[48px] rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-all active:scale-[0.98]"
                >
                  Regresar al catálogo de torneos
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
