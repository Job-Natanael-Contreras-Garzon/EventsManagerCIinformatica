// src/app/registro/exito/page.tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { TicketActions } from "./TicketActions";

export const metadata = {
  title: "Inscripción Exitosa | CI Informática",
  description: "Confirmación de registro exitoso para los torneos de la Facultad de Ingeniería Informática.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExitoPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const regId = typeof resolvedSearchParams.regId === "string" ? resolvedSearchParams.regId : undefined;

  let registration = null;

  if (regId) {
    try {
      registration = await db.registration.findUnique({
        where: { confirmationCode: regId },
        include: {
          event: {
            include: {
              category: {
                select: { name: true },
              },
              encargados: true,
            },
          },
          participant: true,
          team: true,
        },
      });
    } catch (e) {
      registration = null;
    }
  }

  // Handle case: Registration not found
  if (!regId || !registration) {
    return (
      <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center justify-center p-4 pb-safe selection:bg-brand-sky selection:text-brand-navy">
        <div className="w-full max-w-md text-center p-8 bg-brand-navy/60 border border-brand-blue/35 rounded-2xl shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky mx-auto">
            <svg className="w-8 h-8 text-rose-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Inscripción No Encontrada</h2>
            <p className="text-sm text-brand-light-gray/70 leading-relaxed">
              No hemos podido localizar ningún registro con el código proporcionado. Verifica tu enlace de confirmación o ponte en contacto con los organizadores.
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

  const { event, participant, team } = registration;
  const formattedDate = new Date(registration.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center py-8 pb-24 px-4 selection:bg-brand-sky selection:text-brand-navy">
      
      {/* Container */}
      <main className="w-full max-w-md flex flex-col gap-6 items-center">
        
        {/* Animated Checkmark and Premium Confirmation Header */}
        <div className="text-center space-y-2.5 mt-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/5 animate-pulse">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white">¡Inscripción Exitosa!</h1>
            <p className="text-xs text-brand-sky/60 font-medium uppercase tracking-wider">
              Tu participación ha sido confirmada
            </p>
          </div>
        </div>

        {/* Premium Ticket Card */}
        <section id="ticket-card" className="w-full relative rounded-3xl border border-brand-blue/35 bg-brand-navy/80 p-6 shadow-2xl flex flex-col gap-5 overflow-hidden">
          {/* Decorative Corner Dents (Punched Ticket look) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-6 h-6 rounded-full bg-[#0e1693] border border-brand-blue/35 z-10" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-6 h-6 rounded-full bg-[#0e1693] border border-brand-blue/35 z-10" />

          {/* Ticket Header */}
          <div className="flex justify-between items-start gap-4 pb-4 border-b border-dashed border-brand-blue/30">
            <div>
              <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest block">
                {event.category?.name || "Semana Universitaria"}
              </span>
              <h2 className="text-lg font-extrabold text-white mt-0.5 leading-snug">
                {event.name}
              </h2>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 shrink-0">
              Activo
            </span>
          </div>

          {/* Ticket Details */}
          <div className="space-y-4 text-sm">
            {/* Participant */}
            <div>
              <span className="text-[10px] font-bold text-brand-sky/60 uppercase tracking-wider block">
                Participante
              </span>
              <span className="font-semibold text-brand-light-gray block mt-0.5">
                {participant.fullName}
              </span>
            </div>

            {/* University Register Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-brand-sky/60 uppercase tracking-wider block">
                  Código Univ.
                </span>
                <span className="font-semibold text-brand-light-gray/90 block mt-0.5 font-mono">
                  {participant.registerCode}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-brand-sky/60 uppercase tracking-wider block">
                  Contacto
                </span>
                <span className="font-semibold text-brand-light-gray/90 block mt-0.5">
                  {participant.phone}
                </span>
              </div>
            </div>

            {/* Team details if applicable */}
            {team && (
              <div className="p-3 bg-brand-dark/40 border border-brand-blue/30 rounded-xl mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-brand-sky uppercase tracking-wider block">
                      Equipo
                    </span>
                    <span className="font-bold text-brand-light-gray block mt-0.5 truncate">
                      {team.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-brand-sky uppercase tracking-wider block">
                      Código de Equipo
                    </span>
                    <span className="font-mono font-black text-white text-base tracking-widest block mt-0.5">
                      {team.code}
                    </span>
                  </div>
                </div>
                {team.leaderId === participant.id && (
                  <span className="inline-block mt-2 text-[9px] font-semibold text-brand-sky bg-brand-sky/10 border border-brand-sky/20 px-2 py-0.5 rounded-full">
                    Líder de Equipo (Creador)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Ticket Footer / Confirmation Code */}
          <div className="pt-4 border-t border-dashed border-brand-blue/30 flex flex-col items-center justify-center gap-1.5 mt-2">
            <span className="text-[10px] font-bold text-brand-sky/60 uppercase tracking-widest">
              Código de Confirmación
            </span>
            <span className="font-mono text-xl font-black text-white tracking-widest uppercase bg-brand-dark/80 border border-brand-blue/40 px-4 py-1.5 rounded-xl shadow-inner">
              {registration.confirmationCode}
            </span>
            <span className="text-[10px] text-brand-sky/50 mt-1 font-medium">
              Inscrito el {formattedDate}
            </span>
          </div>
        </section>

        {/* Export & Share Ticket Actions */}
        <TicketActions
          confirmationCode={registration.confirmationCode}
          eventName={event.name}
          participantName={participant.fullName}
          ticketElementId="ticket-card"
        />

        {/* Action Coordinator Coordinates (Whatsapp Contact) */}
        {event.encargados.length > 0 && (
          <section className="w-full space-y-3">
            <div className="pl-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-sky/70">
                Coordinadores del Torneo
              </h3>
              <p className="text-[11px] text-brand-sky/50 mt-0.5">
                Escríbeles para unirte al grupo oficial de WhatsApp del torneo o coordinar detalles de horarios.
              </p>
            </div>

            <div className="space-y-2 w-full">
              {event.encargados.map((enc) => (
                <div
                  key={enc.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-brand-dark/45 p-3 border border-brand-blue/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-blue/60 border border-brand-blue/30 flex items-center justify-center text-xs font-bold text-white">
                      {enc.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block line-clamp-1">
                        {enc.name}
                      </span>
                      <span className="text-[10px] text-brand-sky/60 font-medium">
                        Encargado(a)
                      </span>
                    </div>
                  </div>
                  <a
                    href={enc.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-xs font-semibold transition-all duration-150 hover:bg-emerald-500/20 active:scale-95 min-h-[44px] min-w-[44px]"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.453 5.418 1.454 5.441.002 9.87-4.424 9.873-9.87.001-2.637-1.023-5.117-2.883-6.979C17.195 1.898 14.718.875 12.01.875c-5.445 0-9.875 4.426-9.878 9.874a9.815 9.815 0 001.488 5.16l-.974 3.56 3.65-.957z" />
                    </svg>
                    <span>Escribir</span>
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Back to Catalog Button */}
        <section className="w-full pt-4">
          <Link
            href="/"
            className="flex items-center justify-center w-full min-h-[50px] rounded-xl bg-brand-blue/60 hover:bg-brand-blue/80 text-brand-light-gray hover:text-white border border-brand-blue/30 text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
          >
            Volver al Catálogo de Torneos
          </Link>
        </section>
      </main>
    </div>
  );
}
