// src/app/_components/EventDetailModal.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ActiveEvent } from "@/modules/registration/types/event.types";
import { getCategoryStyles } from "@/components/EventCard/variants";
import { cn } from "./utils";

interface EventDetailModalProps {
  event: ActiveEvent | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (event) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [event]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!event) return null;

  const styles = getCategoryStyles(event.category.name);
  const now = new Date();
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const eventDate = new Date(event.date);

  const isDeadlinePassed = deadline ? deadline < now : false;
  const isFull = event.maxParticipants !== null && event.currentRegistrations >= event.maxParticipants;
  const isOpen = event.isActive && !isDeadlinePassed && !isFull;

  // Formatting date
  const formattedEventDate = eventDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const formattedDeadline = deadline
    ? deadline.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-brand-dark border border-brand-blue/25 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button floating at the top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-brand-dark/90 backdrop-blur-md text-white/60 hover:text-white border border-brand-blue/30 flex items-center justify-center transition-all active:scale-90"
          title="Cerrar detalles"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable Content wrapper */}
        <div className="overflow-y-auto scrollbar-none flex-1">
          {/* Full Resolution Flyer Image */}
          {event.imageBase64 && (
            <div className="w-full aspect-square bg-brand-dark/40 border-b border-brand-blue/20 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/webp;base64,${event.imageBase64}`}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Details Body */}
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              {/* Header Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", styles.badge)}>
                  {event.category.name}
                </span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border", statusClass)}>
                  {statusText}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-black tracking-tight text-white">
                {event.name}
              </h3>
            </div>

            {/* Description */}
            {event.description && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Descripción
                </h4>
                <p className="text-sm leading-relaxed text-brand-light-gray font-normal">
                  {event.description}
                </p>
              </div>
            )}            {/* Info Grid */}
            <div className="space-y-3 border-t border-b border-brand-blue/20 py-4 text-sm text-brand-light-gray/80">
              {/* Date */}
              <div className="flex items-start gap-3">
                <svg className={cn("w-5 h-5 shrink-0 mt-0.5", styles.accent)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 leading-none mb-1">Fecha y Hora</p>
                  <span className="font-semibold text-brand-light-gray capitalize" suppressHydrationWarning>{formattedEventDate}</span>
                </div>
              </div>

              {/* Registration Deadline */}
              {formattedDeadline && (
                <div className="flex items-start gap-3">
                  <svg className={cn("w-5 h-5 shrink-0 mt-0.5", isDeadlinePassed ? "text-rose-450" : "text-brand-sky/40")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 leading-none mb-1">Límite de Registro</p>
                    <span className={cn("font-semibold", isDeadlinePassed ? "text-rose-450" : "text-brand-light-gray")} suppressHydrationWarning>{formattedDeadline}</span>
                  </div>
                </div>
              )}

              {/* Spots Counter */}
              <div className="flex items-start gap-3">
                <svg className={cn("w-5 h-5 shrink-0 mt-0.5", styles.accent)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 leading-none mb-1">Cupos ocupados</p>
                  <span className="font-semibold text-brand-light-gray">
                    {event.currentRegistrations}
                    {event.maxParticipants !== null && (
                      <>
                        {" "}
                        / <span className="text-brand-sky/60">{event.maxParticipants} max</span>
                      </>
                    )}
                    {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 4 && (
                      <span className="ml-2 text-xs font-semibold text-amber-400 animate-pulse">
                        (¡Solo {spotsLeft} cupos!)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Coordinadores / Encargados */}
            {event.encargados.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Coordinación del Torneo
                </h4>
                <div className="space-y-2">
                  {event.encargados.map((enc) => (
                    <div
                      key={enc.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-brand-dark/60 p-3 border border-brand-blue/20"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-blue/50 border border-brand-blue/30 flex items-center justify-center text-sm font-semibold text-white">
                          {enc.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{enc.name}</p>
                          <p className="text-[10px] text-brand-sky/60 font-medium">Encargado oficial</p>
                        </div>
                      </div>
                      <a
                        href={enc.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-450 border border-emerald-500/20 text-xs font-bold transition-all active:scale-95"
                      >
                        <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
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
        </div>

        {/* Sticky Register CTA Footer */}
        <div className="p-6 bg-brand-dark/80 border-t border-brand-blue/20">
          {isOpen ? (
            <Link
              href={`/registro?gameId=${event.id}`}
              className={cn(
                "flex items-center justify-center w-full min-h-[48px] rounded-xl text-sm font-bold shadow-lg shadow-brand-navy/20 transition-all duration-200 active:scale-[0.97] hover:brightness-110",
                styles.button
              )}
            >
              Registrarse ahora
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center justify-center w-full min-h-[48px] rounded-xl bg-brand-dark/40 border border-brand-blue/30 text-brand-light-gray/40 text-sm font-semibold cursor-not-allowed"
            >
              {isDeadlinePassed
                ? "Inscripciones cerradas"
                : isFull
                ? "Sin cupos disponibles"
                : "No disponible"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
