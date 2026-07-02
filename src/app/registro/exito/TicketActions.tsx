// src/app/registro/exito/TicketActions.tsx
// =========================================================
// Client Component: Botones de exportar y compartir ticket.
// Usa html-to-image (SVG foreignObject) que soporta CSS moderno
// incluyendo oklab(), color-mix() y otras funciones de Tailwind v4.
// =========================================================
"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";

interface TicketActionsProps {
  /** Código de confirmación usado para nombrar el archivo descargado */
  confirmationCode: string;
  /** Nombre del evento para compartir */
  eventName: string;
  /** Nombre completo del participante */
  participantName: string;
  /** ID del elemento DOM del ticket que se capturará */
  ticketElementId: string;
}

type ActionState = "idle" | "capturing" | "success" | "error";

/**
 * Captura el elemento DOM del ticket como blob PNG de alta resolución.
 * html-to-image usa SVG foreignObject lo que le permite renderizar CSS
 * moderno (oklab, color-mix, etc.) que html2canvas no soporta.
 */
async function captureTicketBlob(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("No se encontró el ticket en el DOM.");
  }

  const dataUrl = await toPng(element, {
    pixelRatio: 3,           // Alta resolución (retina / compartir en redes)
    cacheBust: true,         // Evitar problemas de caché en recursos externos
    backgroundColor: "#0d1162", // brand-navy sólido para fondo opaco
    style: {
      // Asegurar bordes redondeados y sin desbordamiento en la captura
      borderRadius: "1.5rem",
      overflow: "hidden",
    },
  });

  // Convertir data URL a Blob
  const res = await fetch(dataUrl);
  return res.blob();
}

export function TicketActions({
  confirmationCode,
  eventName,
  participantName,
  ticketElementId,
}: TicketActionsProps) {
  const [state, setState] = useState<ActionState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastBlobRef = useRef<Blob | null>(null);

  /** Descarga el ticket como archivo PNG */
  const handleExport = async () => {
    setState("capturing");
    setErrorMsg(null);
    try {
      const blob = await captureTicketBlob(ticketElementId);
      lastBlobRef.current = blob;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${confirmationCode}.png`;
      a.click();
      URL.revokeObjectURL(url);

      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      console.error("Error al exportar el ticket:", err);
      setErrorMsg(err instanceof Error ? err.message : "Error al generar la imagen.");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  /**
   * Comparte el ticket usando la Web Share API con cascada de fallbacks:
   * 1. Share nativo con imagen (móviles modernos)
   * 2. Share nativo solo texto (escritorio / dispositivos sin file share)
   * 3. Copiar texto al portapapeles (último recurso)
   */
  const handleShare = async () => {
    setState("capturing");
    setErrorMsg(null);
    try {
      const blob = await captureTicketBlob(ticketElementId);
      lastBlobRef.current = blob;

      const file = new File([blob], `ticket-${confirmationCode}.png`, { type: "image/png" });
      const shareText =
        `¡Me inscribí en ${eventName}! 🎮\n` +
        `Participante: ${participantName}\n` +
        `Código: ${confirmationCode}`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        // ── Share nativo con imagen adjunta ──────────────────────────
        await navigator.share({
          title: `Ticket de inscripción — ${eventName}`,
          text: shareText,
          files: [file],
        });
      } else if (navigator.share) {
        // ── Share nativo sin archivo (solo texto) ────────────────────
        await navigator.share({
          title: `Ticket — ${eventName}`,
          text: shareText,
        });
      } else {
        // ── Fallback: copiar al portapapeles ─────────────────────────
        await navigator.clipboard.writeText(shareText);
      }

      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      // El usuario canceló el share dialog — no es error
      if (err instanceof Error && err.name === "AbortError") {
        setState("idle");
        return;
      }
      console.error("Error al compartir el ticket:", err);
      setErrorMsg(err instanceof Error ? err.message : "Error al compartir.");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  const isLoading = state === "capturing";

  return (
    <div className="w-full flex flex-col gap-3">
      {/* ── Fila: Exportar + Compartir ─────────────────────────────── */}
      <div className="flex gap-3">

        {/* Botón Exportar imagen */}
        <button
          type="button"
          id="btn-export-ticket"
          onClick={handleExport}
          disabled={isLoading}
          aria-label="Exportar ticket como imagen PNG"
          className={`flex-1 flex items-center justify-center gap-2 min-h-[50px] rounded-xl border text-sm font-semibold transition-all duration-200 active:scale-[0.97] select-none ${
            state === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : state === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : isLoading
              ? "bg-brand-dark/50 border-brand-blue/20 text-brand-sky/40 cursor-wait"
              : "bg-brand-dark/50 border-brand-blue/30 text-brand-light-gray hover:bg-brand-blue/20 hover:border-brand-blue/50 hover:text-white"
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-brand-sky/30 border-t-brand-sky animate-spin shrink-0" />
              <span>Capturando…</span>
            </>
          ) : state === "success" ? (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>¡Guardado!</span>
            </>
          ) : state === "error" ? (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>Error</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Exportar ticket</span>
            </>
          )}
        </button>

        {/* Botón Compartir */}
        <button
          type="button"
          id="btn-share-ticket"
          onClick={handleShare}
          disabled={isLoading}
          aria-label="Compartir ticket"
          className={`flex-1 flex items-center justify-center gap-2 min-h-[50px] rounded-xl border text-sm font-semibold transition-all duration-200 active:scale-[0.97] select-none ${
            isLoading
              ? "bg-violet-500/5 border-violet-500/15 text-violet-400/40 cursor-wait"
              : "bg-violet-500/10 border-violet-500/25 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 hover:text-white"
          }`}
        >
          {isLoading ? (
            <span className="w-4 h-4 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
          <span>Compartir</span>
        </button>
      </div>

      {/* Feedback de error */}
      {state === "error" && errorMsg && (
        <p className="text-[10px] text-rose-400 text-center font-medium" role="alert">
          {errorMsg}
        </p>
      )}

      {/* Texto guía */}
      <p className="text-[10px] text-brand-sky/35 text-center leading-relaxed">
        Guarda tu ticket como imagen o compártelo directamente.
        <br />
        El código de confirmación es necesario para validar tu inscripción.
      </p>
    </div>
  );
}
