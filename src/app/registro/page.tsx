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
          type: true,
          status: true,
          isActive: true,
          registrationDeadline: true,
          maxParticipants: true,
          category: {
            select: { name: true },
          },
          _count: {
            select: { registrations: true, teams: true },
          },
        },
      });
    } catch {
      isInvalidUuid = true;
    }
  }

  // Handle case: Event not found or missing search param
  if (!gameId || !event || isInvalidUuid) {
    return (
      <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center justify-center p-4 pb-safe selection:bg-brand-sky selection:text-brand-navy">
        <div className="w-full max-w-md text-center p-8 bg-brand-navy/60 border border-brand-blue/35 rounded-2xl shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky mx-auto">
            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Actividad no encontrada</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              No hemos podido identificar la actividad a la cual deseas inscribirte. Por favor, regresa al catálogo principal.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="flex items-center justify-center w-full min-h-[48px] rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white border border-brand-blue/40 text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
            >
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si el evento es de tipo OPEN (abierto/informativo), no admite registro público
  if (event.type === "OPEN") {
    return (
      <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center justify-center p-4 pb-safe selection:bg-brand-sky selection:text-brand-navy">
        <div className="w-full max-w-md text-center p-8 bg-brand-navy/60 border border-brand-blue/35 rounded-2xl shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-amber-400 mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">{event.name}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Esta actividad es informativa y de libre asistencia. No requiere un registro previo. ¡Te esperamos!
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="flex items-center justify-center w-full min-h-[48px] rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white border border-brand-blue/40 text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
            >
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const isDeadlinePassed = deadline ? deadline < now : false;
  
  // Si es en equipo, contamos por equipos
  const count = event.type === "TEAM" ? event._count.teams : event._count.registrations;
  const isFull = event.maxParticipants !== null && count >= event.maxParticipants;
  const isFinished = event.status === "FINISHED";

  const isOpen = event.isActive && !isDeadlinePassed && !isFull && !isFinished;

  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center py-6 pb-24 px-4 selection:bg-brand-sky selection:text-brand-navy">
      
      {/* Header back button */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-brand-sky/70 hover:text-brand-sky text-sm font-medium transition-all group min-h-[44px] min-w-[44px]"
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
        <span className="text-[10px] font-bold text-brand-sky/70 uppercase tracking-widest bg-brand-dark/60 border border-brand-blue/30 px-2.5 py-1 rounded-lg">
          {event.type === "TEAM" ? "Torneo en Equipo" : "Torneo Individual"}
        </span>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-md flex flex-col gap-6">
        
        {/* Game Title Summary Card */}
        <section className="relative overflow-hidden rounded-2xl border border-brand-blue/30 bg-gradient-to-b from-brand-dark/40 to-brand-navy/10 p-5">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-sky/5 rounded-full blur-2xl" />
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest">
              {event.category?.name || "Semana Universitaria"}
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white leading-tight">
              {event.name}
            </h1>
            {event.description && (
              <p className="text-xs text-brand-light-gray/70 leading-relaxed font-normal">
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
              registrationMode={event.type as "INDIVIDUAL" | "TEAM"}
            />
          ) : (
            <div className="w-full p-6 text-center bg-brand-dark/50 border border-brand-blue/30 rounded-2xl shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-navy/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky/50 mx-auto">
                <svg className="w-6 h-6 text-rose-450" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Inscripciones Cerradas</h3>
                <p className="text-xs text-brand-light-gray/50 leading-relaxed max-w-xs mx-auto">
                  {isFinished
                    ? "Esta actividad ya ha finalizado."
                    : isDeadlinePassed
                    ? "El plazo límite de registro para este torneo ha expirado."
                    : isFull
                    ? "El cupo máximo de participantes para este torneo ha sido completado."
                    : "El registro para este torneo no se encuentra disponible actualmente."}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/"
                  className="flex items-center justify-center w-full min-h-[48px] rounded-xl bg-brand-blue/60 hover:bg-brand-blue/80 text-brand-light-gray border border-brand-blue/30 text-xs font-semibold transition-all active:scale-[0.98]"
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
