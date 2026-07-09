// src/components/EventCard/index.tsx
import Link from "next/link";
import { cn } from "@/app/_components/utils";
import type { EventCardProps } from "./types";
import { getCategoryStyles } from "./variants";

const GENDER_LABELS: Record<string, string> = {
  BOTH: "Mixto",
  WOMEN: "Femenino",
  MEN: "Masculino",
};

export function EventCard({ event, className, onViewDetails }: EventCardProps) {
  const styles = getCategoryStyles(event.category.name);
  const now = new Date();
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const eventDate = new Date(event.date);

  const isDeadlinePassed = deadline ? deadline < now : false;
  const isFull = event.maxParticipants !== null && event.currentRegistrations >= event.maxParticipants;
  
  // Status check:
  const isFinished = event.status === "FINISHED";
  const isInProgress = event.status === "IN_PROGRESS";
  
  // Registration availability
  const isOpen = event.isActive && !isDeadlinePassed && !isFull && !isFinished;

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

  if (isFinished) {
    statusText = "Finalizado";
    statusClass = "bg-zinc-800 text-zinc-400 border-zinc-700";
  } else if (isInProgress) {
    statusText = "En Curso";
    statusClass = "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse";
  } else if (!event.isActive) {
    statusText = "Inscripción Cerrada";
    statusClass = "bg-rose-500/10 text-rose-400 border-rose-500/25";
  } else if (isDeadlinePassed) {
    statusText = "Plazo Vencido";
    statusClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  } else if (isFull) {
    statusText = "Cupos Llenos";
    statusClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  // Fields to hide (from disabledFields)
  const isDescriptionHidden = event.disabledFields?.includes("description");
  const isCategoryHidden = event.disabledFields?.includes("category");
  const isDateHidden = event.disabledFields?.includes("date");
  const isDeadlineHidden = event.disabledFields?.includes("registrationDeadline");
  const isOccupancyHidden = event.disabledFields?.includes("occupancy");
  const isCoordinatorsHidden = event.disabledFields?.includes("coordinators");
  const isGenderHidden = event.disabledFields?.includes("gender");

  // Calculate spots left
  const spotsLeft = event.maxParticipants !== null ? event.maxParticipants - event.currentRegistrations : null;

  // Layout selection based on imageBase64 presence
  if (event.imageBase64) {
    return (
      <article
        onClick={onViewDetails}
        className={cn(
          "group relative flex flex-col justify-end w-full aspect-square min-h-[360px] rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.01] cursor-pointer",
          event.isPinned
            ? "border-brand-sky/70 ring-2 ring-brand-sky/40 shadow-brand-sky/10"
            : isFinished && event.winnerName
            ? "border-amber-500/50 shadow-amber-500/5"
            : "border-brand-blue/30 hover:border-brand-sky/40",
          styles.glow,
          className
        )}
        style={{
          backgroundImage: `url(data:image/webp;base64,${event.imageBase64})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent z-0 transition-opacity duration-300 group-hover:via-black/60" />

        {/* Content on top */}
        <div className="relative z-10 p-4 flex flex-col justify-between h-full w-full">
          {/* Top Row: Floating badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {event.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-brand-sky/25 border-brand-sky/50 text-brand-sky backdrop-blur-sm">
                  <svg className="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  Destacado
                </span>
              )}
              {!isCategoryHidden && (
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-brand-navy/80 backdrop-blur-sm", styles.accent)}>
                  {event.category.name}
                </span>
              )}
            </div>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border bg-black/60 backdrop-blur-sm", statusClass)}>
              {statusText}
            </span>
          </div>

          {/* Bottom Row: Text and button */}
          <div className="space-y-2 mt-auto flex flex-col items-start w-full">
            {/* Winner premium badge displayed above the title */}
            {isFinished && event.winnerName && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/35 via-yellow-500/15 to-brand-navy/60 border border-amber-400/40 backdrop-blur-md self-start mb-1 text-white shadow-lg shadow-amber-500/10 max-w-full">
                <svg className="w-4 h-4 shrink-0 text-amber-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-bold text-amber-300 tracking-widest uppercase leading-none">Campeón</span>
                  <span className="text-[11px] font-black tracking-tight text-white leading-tight uppercase truncate">
                    {event.winnerName}
                  </span>
                </div>
              </div>
            )}

            {/* Event Name */}
            <h3 className="text-base font-black tracking-tight text-white line-clamp-2 drop-shadow-md group-hover:text-brand-sky transition-colors text-left">
              {event.name}
            </h3>
            
            <div className="flex flex-col gap-1 text-[11px] text-zinc-300 font-medium drop-shadow">
              {!isDateHidden && (
                <span className="flex items-center gap-1.5" suppressHydrationWarning>
                  <svg className="w-3.5 h-3.5 shrink-0 text-brand-sky/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formattedEventDate}
                </span>
              )}

              {event.type !== "OPEN" && !isOccupancyHidden && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0 text-brand-sky/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Inscritos: {event.currentRegistrations}{event.maxParticipants !== null && ` / ${event.maxParticipants} max`}</span>
                </span>
              )}

              {/* Dynamic labels list summary (e.g. Premios, Lugar) - limit to max 2 items on image card */}
              {event.customFields.slice(0, 2).map((field, i) => (
                <span key={i} className="flex items-center gap-1.5 text-brand-sky/90">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="line-clamp-1">{field.label}: {field.value}</span>
                </span>
              ))}
            </div>

            <div className="pt-1">
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 w-full min-h-[36px] py-1 px-3 rounded-xl text-xs font-bold transition-all duration-150 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/15 active:scale-95"
              >
                Ver detalles
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Text list layout (if no imageBase64)
  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between w-full rounded-2xl border bg-brand-dark/80 p-5 shadow-xl transition-all duration-300 hover:border-brand-blue/40 sm:p-6",
        event.isPinned
          ? "border-brand-sky/60 ring-2 ring-brand-sky/30 shadow-brand-sky/5"
          : isFinished && event.winnerName
          ? "border-amber-500/40 shadow-amber-500/5 bg-gradient-to-b from-brand-dark/90 to-amber-950/10"
          : "border-brand-blue/20",
        styles.glow,
        className
      )}
    >
      <div>
        {/* Top Winner Info */}
        {isFinished && event.winnerName && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/35 flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
            <div>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block leading-none">Ganador oficial</span>
              <span className="text-xs font-bold text-white leading-tight">{event.winnerName}</span>
            </div>
          </div>
        )}

        {/* Header: Category Badge & Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {event.isPinned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider bg-brand-sky/20 border-brand-sky/40 text-brand-sky">
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                Destacado
              </span>
            )}
            {!isCategoryHidden && (
              <span className={cn("px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider", styles.badge)}>
                {event.category.name}
              </span>
            )}
          </div>
          <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", statusClass)}>
            {statusText}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-lg font-black tracking-tight text-white group-hover:text-brand-sky transition-colors duration-150">
          {event.name}
        </h3>

        {/* Description */}
        {!isDescriptionHidden && event.description && (
          <p className="mt-2 text-xs leading-relaxed text-white/60 font-normal line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Details Grid */}
        <div className="mt-4 space-y-2 border-t border-brand-blue/20 pt-4 text-xs text-brand-light-gray/80">
          {/* Date */}
          {!isDateHidden && (
            <div className="flex items-center gap-2">
              <svg className={cn("w-4 h-4 shrink-0", styles.accent)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold text-zinc-300" suppressHydrationWarning>{formattedEventDate}</span>
            </div>
          )}

          {/* Registration Deadline */}
          {!isDeadlineHidden && formattedDeadline && (
            <div className="flex items-center gap-2">
              <svg className={cn("w-4 h-4 shrink-0", isDeadlinePassed ? "text-rose-400" : "text-zinc-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Cierre:{" "}
                <strong className={cn("font-semibold", isDeadlinePassed ? "text-rose-400" : "text-zinc-300")} suppressHydrationWarning>
                  {formattedDeadline}
                </strong>
              </span>
            </div>
          )}

          {/* Spots Counter */}
          {event.type !== "OPEN" && !isOccupancyHidden && (
            <div className="flex items-center gap-2">
              <svg className={cn("w-4 h-4 shrink-0", styles.accent)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>
                Inscritos:{" "}
                <strong className="font-semibold text-zinc-300">{event.currentRegistrations}</strong>
                {event.maxParticipants !== null && (
                  <> / <span className="text-zinc-500">{event.maxParticipants} max</span></>
                )}
                {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 4 && (
                  <span className="ml-1.5 font-bold text-amber-400 animate-pulse">(¡Últimos {spotsLeft} cupos!)</span>
                )}
              </span>
            </div>
          )}

          {/* Participación (Type) */}
          <div className="flex items-center gap-2">
            <svg className={cn("w-4 h-4 shrink-0", styles.accent)} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>
              Modalidad:{" "}
              <strong className="font-semibold text-zinc-300">
                {event.type === "TEAM" ? "En Equipo" : event.type === "OPEN" ? "Participación Libre" : "Individual"}
              </strong>
            </span>
          </div>

          {/* Género/Sexo */}
          {!isGenderHidden && (
            <div className="flex items-center gap-2">
              <svg className={cn("w-4 h-4 shrink-0", styles.accent)} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c-1.306 0-2.417.835-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <span>
                Categoría Género:{" "}
                <strong className="font-semibold text-zinc-300">
                  {GENDER_LABELS[event.gender] ?? "Mixto"}
                </strong>
              </span>
            </div>
          )}

          {/* Custom Fields dynamic print */}
          {event.customFields.map((field, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg className={cn("w-4 h-4 shrink-0", styles.accent)} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>
                {field.label}: <strong className="font-semibold text-white">{field.value}</strong>
              </span>
            </div>
          ))}
        </div>

        {/* Coordinadores / Encargados */}
        {!isCoordinatorsHidden && event.encargados.length > 0 && (
          <div className="mt-4 border-t border-brand-blue/20 pt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/70 mb-2">
              Coordinación
            </h4>
            <div className="space-y-1.5">
              {event.encargados.map((enc) => (
                <div key={enc.id} className="flex items-center justify-between gap-2 rounded-xl bg-brand-dark/50 p-2 border border-brand-blue/15">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-blue/40 flex items-center justify-center text-[10px] font-bold text-white">
                      {enc.name.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-zinc-300 line-clamp-1">{enc.name}</span>
                  </div>
                  <a
                    href={enc.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold transition-all min-h-[32px] shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
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
      <div className="mt-5 pt-3 border-t border-brand-blue/20">
        {event.type === "OPEN" ? (
          <button
            onClick={onViewDetails}
            className="flex items-center justify-center w-full min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-400/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all active:scale-[0.98]"
          >
            Participación Libre (Más Info)
          </button>
        ) : isOpen ? (
          <Link
            href={`/registro?gameId=${event.id}`}
            className={cn(
              "flex items-center justify-center w-full min-h-[44px] rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              styles.button
            )}
          >
            Registrarse ahora
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center justify-center w-full min-h-[44px] rounded-xl bg-brand-dark/40 border border-brand-blue/30 text-brand-light-gray/40 text-xs font-semibold cursor-not-allowed"
          >
            {isFinished
              ? "Evento Finalizado"
              : isDeadlinePassed
              ? "Plazo de Registro Vencido"
              : isFull
              ? "Cupos Completados"
              : "Inscripciones Cerradas"}
          </button>
        )}
      </div>
    </article>
  );
}
