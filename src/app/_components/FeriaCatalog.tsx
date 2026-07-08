// src/app/_components/FeriaCatalog.tsx
"use client";

import { useState } from "react";
import { ActiveFeria } from "@/modules/ferias/types/feria.types";
import { FeriaCard } from "@/components/FeriaCard";

interface FeriaCatalogProps {
  initialFerias: ActiveFeria[];
}

export function FeriaCatalog({ initialFerias }: FeriaCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFerias = initialFerias.filter((feria) => {
    if (!feria.isActive) return false;

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchName = feria.name.toLowerCase().includes(query);
      const matchDesc = (feria.description || "").toLowerCase().includes(query);
      if (!matchName && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="w-full space-y-6">
      {/* Search Input */}
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-brand-sky/50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Buscar Emprendimientos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[48px] pl-11 pr-4 py-2.5 bg-brand-dark/50 border border-brand-blue/30 rounded-xl text-white placeholder:text-white/30 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky/50 focus-visible:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 min-h-[44px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Ferias List Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredFerias.length > 0 ? (
          filteredFerias.map((feria) => (
            <FeriaCard
              key={feria.id}
              feria={feria}
            />
          ))
        ) : (
          /* Elegant Empty State */
          <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center py-12 px-4 border border-brand-blue/20 rounded-2xl bg-brand-navy/40 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky mb-4 font-bold text-lg">
              🎪
            </div>
            <h4 className="text-base font-bold text-zinc-300">No se encontraron ferias</h4>
            <p className="mt-1.5 text-sm text-zinc-500 max-w-xs leading-relaxed">
              No hay actividades de emprendimiento activas que coincidan con la búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
