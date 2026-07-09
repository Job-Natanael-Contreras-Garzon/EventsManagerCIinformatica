"use client";

import { ActiveFeria } from "@/modules/ferias/types/feria.types";

interface FeriaCardProps {
  feria: ActiveFeria;
}

export function FeriaCard({ feria }: FeriaCardProps) {
  const isExternalReg = !!feria.registrationUrl;
  const imageSrc = feria.imageBase64 ? `data:image/webp;base64,${feria.imageBase64}` : null;

  return (
    <article className="group relative flex flex-col w-full rounded-3xl border border-brand-blue/25 overflow-hidden shadow-2xl bg-brand-dark/80 transition-all duration-300 hover:scale-[1.01] hover:border-brand-sky/40">
      {/* Imagen COMPLETA del afiche (sin recorte). Fondo tenue para posters con
          proporciones distintas y así se aprecia el póster entero y grande. */}
      <div className="relative w-full bg-brand-navy/60">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={feria.name}
            className="block w-full h-auto object-contain"
          />
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-b from-brand-dark/70 to-brand-navy/80 text-brand-sky/25">
            <svg className="w-20 h-20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 15.75h.75a.75.75 0 00.75-.75v-.75a.75.75 0 00-.75-.75h-.75a.75.75 0 00-.75.75v.75c0 .414.336.75.75.75z" />
            </svg>
          </div>
        )}

        {/* Badges superiores flotantes sobre la imagen */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-navy/85 border border-brand-sky/25 text-brand-sky backdrop-blur-sm">
            Emprendimiento
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/20 border-emerald-400/30 text-emerald-300 backdrop-blur-sm">
            {feria.cost}
          </span>
        </div>
      </div>

      {/* Contenido en panel sólido debajo de la imagen */}
      <div className="relative z-10 p-4 md:p-5 flex flex-col gap-3 border-t border-brand-blue/20">
        <div className="space-y-1.5">
          <h3 className="text-lg font-black tracking-tight text-white leading-tight line-clamp-2 group-hover:text-brand-sky transition-colors">
            {feria.name}
          </h3>
          {feria.description && (
            <p className="text-[11px] leading-relaxed text-zinc-400 line-clamp-2">
              {feria.description}
            </p>
          )}
        </div>

        {/* Fechas */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300">
          <svg className="w-3.5 h-3.5 shrink-0 text-brand-sky/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{feria.dates}</span>
        </div>

        {/* Coordinación (máx. 2) */}
        {feria.encargados.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {feria.encargados.slice(0, 2).map((enc) => (
              <div
                key={enc.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-brand-navy/50 border border-white/10 p-1.5 pl-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-brand-blue/50 border border-white/15 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {enc.name.charAt(0)}
                  </div>
                  <span className="text-[11px] font-semibold text-white/90 line-clamp-1">{enc.name}</span>
                </div>
                <a
                  href={enc.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/25 text-[10px] font-bold transition-all min-h-[30px] shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.453 5.418 1.454 5.441.002 9.87-4.424 9.873-9.87.001-2.637-1.023-5.117-2.883-6.979C17.195 1.898 14.718.875 12.01.875c-5.445 0-9.875 4.426-9.878 9.874a9.815 9.815 0 001.488 5.16l-.974 3.56 3.65-.957z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="pt-1">
          {isExternalReg ? (
            <a
              href={feria.registrationUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full min-h-[42px] rounded-xl text-xs font-bold bg-brand-blue/70 hover:bg-brand-blue text-white border border-brand-sky/30 transition-all active:scale-95"
            >
              Registrarse ahora
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ) : (
            <button
              disabled
              className="flex items-center justify-center w-full min-h-[42px] rounded-xl bg-brand-navy/40 border border-white/10 text-white/40 text-xs font-bold cursor-not-allowed"
            >
              Inscripción próximamente
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
