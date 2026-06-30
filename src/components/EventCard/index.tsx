// src/components/EventCard/index.tsx
import Link from "next/link";
import { cn } from "@/app/_components/utils";
import type { EventCardProps } from "./types";
import { getCategoryStyles } from "./variants";

export function EventCard({ event, className }: EventCardProps) {
  const styles = getCategoryStyles(event.category.name);
  const now = new Date();
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const eventDate = new Date(event.date);

  const isDeadlinePassed = deadline ? deadline < now : false;
  const isFull = event.maxParticipants !== null && event.currentRegistrations >= event.maxParticipants;
  const isOpen = event.isActive && !isDeadlinePassed && !isFull;

  // Formatting date
  const formattedEventDate = eventDate.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const formattedDeadline = deadline
    ? deadline.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  // Status Badge details
  let statusText = "Inscripción Abierta";
  let statusClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (!event.isActive) {
    statusText = "Cerrado";
    statusClass = "bg-zinc-800 text-zinc-400 border-zinc-700";
  } else if (isDeadlinePassed) {
    statusText = "Plazo Vencido";
    statusClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  } else if (isFull) {
    statusText = "Cupos Llenos";
    statusClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  // Calculate spots left
  const spotsLeft = event.maxParticipants !== null ? event.maxParticipants - event.currentRegistrations : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-2xl transition-all duration-300 hover:border-zinc-700 sm:p-6",
        styles.glow,
        className
      )}
    >
      <div>
        {/* Header: Category Badge & Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider",
              styles.badge
            )}
          >
            {event.category.name}
          </span>
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
              statusClass
            )}
          >
            {statusText}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-xl font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors duration-150">
          {event.name}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-400 font-normal line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Details Grid */}
        <div className="mt-5 space-y-2.5 border-t border-zinc-900 pt-4 text-sm text-zinc-400">
          {/* Date */}
          <div className="flex items-center gap-2.5">
            <svg
              className={cn("w-4 h-4 shrink-0", styles.accent)}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium text-zinc-300" suppressHydrationWarning>{formattedEventDate}</span>
          </div>

          {/* Registration Deadline */}
          {formattedDeadline && (
            <div className="flex items-center gap-2.5">
              <svg
                className={cn(
                  "w-4 h-4 shrink-0",
                  isDeadlinePassed ? "text-rose-400" : "text-zinc-500"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Cierre:{" "}
                <strong
                  className={cn(
                    "font-semibold",
                    isDeadlinePassed
                      ? "text-rose-400"
                      : "text-zinc-300"
                  )}
                  suppressHydrationWarning
                >
                  {formattedDeadline}
                </strong>
              </span>
            </div>
          )}

          {/* Spots Counter */}
          <div className="flex items-center gap-2.5">
            <svg
              className={cn("w-4 h-4 shrink-0", styles.accent)}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>
              Inscritos:{" "}
              <strong className="font-semibold text-zinc-300">
                {event.currentRegistrations}
              </strong>
              {event.maxParticipants !== null && (
                <>
                  {" "}
                  / <span className="text-zinc-500">{event.maxParticipants} max</span>
                </>
              )}
              {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 4 && (
                <span className="ml-2 font-semibold text-amber-400 animate-pulse">
                  (¡Solo {spotsLeft} cupos!)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Coordinadores / Encargados */}
        {event.encargados.length > 0 && (
          <div className="mt-5 border-t border-zinc-900 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Coordinación
            </h4>
            <div className="mt-2.5 space-y-2">
              {event.encargados.map((enc) => (
                <div
                  key={enc.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-zinc-900/40 p-2 border border-zinc-800/60"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
                      {enc.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-zinc-300 line-clamp-1">
                      {enc.name}
                    </span>
                  </div>
                  <a
                    href={enc.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all duration-150 hover:bg-emerald-500/20 active:scale-95 min-h-[44px] min-w-[44px]"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.453 5.418 1.454 5.441.002 9.87-4.424 9.873-9.87.001-2.637-1.023-5.117-2.883-6.979C17.195 1.898 14.718.875 12.01.875c-5.445 0-9.875 4.426-9.878 9.874a9.815 9.815 0 001.488 5.16l-.974 3.56 3.65-.957z" />
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Button CTA */}
      <div className="mt-6 pt-4 border-t border-zinc-900">
        {isOpen ? (
          <Link
            href={`/registro?gameId=${event.id}`}
            className={cn(
              "flex items-center justify-center w-full min-h-[48px] rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
              styles.button
            )}
          >
            Registrarse ahora
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center justify-center w-full min-h-[48px] rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-500 text-sm font-semibold cursor-not-allowed"
          >
            {isDeadlinePassed
              ? "Inscripciones cerradas"
              : isFull
              ? "Sin cupos disponibles"
              : "No disponible"}
          </button>
        )}
      </div>
    </article>
  );
}
