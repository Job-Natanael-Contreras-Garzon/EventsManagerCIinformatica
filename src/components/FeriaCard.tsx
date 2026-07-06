// src/components/FeriaCard.tsx
"use client";

import { ActiveFeria } from "@/modules/ferias/types/feria.types";

interface FeriaCardProps {
  feria: ActiveFeria;
}

export function FeriaCard({ feria }: FeriaCardProps) {
  const isExternalReg = !!feria.registrationUrl;

  return (
    <article className="group relative w-full rounded-3xl bg-brand-dark/40 border border-brand-blue/20 p-5 flex flex-col gap-4 shadow-xl hover:border-brand-sky/30 transition-all duration-300 overflow-hidden">
      {/* Decorative background glow on hover */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-brand-sky/5 rounded-full blur-2xl group-hover:bg-brand-sky/10 transition-all" />

      {/* Image / Header Block */}
      <div className="flex gap-4">
        {feria.imageBase64 ? (
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-brand-blue/20 shrink-0 bg-brand-dark/60">
            <img
              src={`data:image/webp;base64,${feria.imageBase64}`}
              alt={feria.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl border border-brand-blue/20 shrink-0 bg-brand-navy/60 flex items-center justify-center text-3xl">
            🎪
          </div>
        )}

        <div className="space-y-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider bg-brand-sky/10 border-brand-sky/20 text-brand-sky">
            Emprendimiento
          </span>
          <h3 className="text-base font-black text-white leading-tight tracking-tight group-hover:text-brand-sky transition-colors">
            {feria.name}
          </h3>
        </div>
      </div>

      {/* Description */}
      {feria.description && (
        <p className="text-xs leading-relaxed text-brand-light-gray/70 line-clamp-3">
          {feria.description}
        </p>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3.5 border-t border-b border-brand-blue/15 py-3.5 text-xs text-brand-light-gray/80">
        <div className="flex items-center gap-2">
          <span className="text-base">💵</span>
          <div>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider leading-none mb-0.5">Costo</p>
            <span className="font-bold text-white">{feria.cost}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <div>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider leading-none mb-0.5">Fechas</p>
            <span className="font-bold text-white">{feria.dates}</span>
          </div>
        </div>
      </div>

      {/* Coordinadores / Encargados */}
      {feria.encargados.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[9px] font-bold uppercase tracking-wider text-brand-sky/70">
            Coordinación
          </h4>
          <div className="space-y-1.5">
            {feria.encargados.map((enc) => (
              <div
                key={enc.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-brand-dark/60 p-2 border border-brand-blue/15"
              >
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

      {/* Button CTA */}
      <div className="mt-2 pt-2 border-t border-brand-blue/15">
        {isExternalReg ? (
          <a
            href={feria.registrationUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full min-h-[44px] rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky text-brand-navy hover:brightness-110 text-xs font-bold transition-all shadow-md shadow-brand-sky/5 active:scale-[0.98]"
          >
            Registrarse ahora (Formulario)
          </a>
        ) : (
          <div className="flex flex-col gap-1.5">
            <button
              disabled
              className="flex items-center justify-center w-full min-h-[44px] rounded-xl bg-brand-navy/60 border border-brand-blue/20 text-brand-sky/40 text-xs font-bold cursor-not-allowed"
            >
              Inscripción (En Desarrollo)
            </button>
            <span className="text-[9px] text-brand-sky/45 text-center font-medium">
              ⚠️ El registro interno para esta feria estará disponible próximamente.
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
