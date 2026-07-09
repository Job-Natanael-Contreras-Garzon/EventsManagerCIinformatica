// src/app/_components/GameCatalog.tsx
"use client";

import { useState, useTransition } from "react";
import { ActiveEvent } from "@/modules/registration/types/event.types";
import { EventCard } from "@/components/EventCard";
import { EventDetailModal } from "./EventDetailModal";
import { cn } from "./utils";

interface GameCatalogProps {
  initialEvents: ActiveEvent[];
}

export function GameCatalog({ initialEvents }: GameCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // null = sin filtro de tipo (muestra todos); "individual" o "team" filtra
  const [activeTab, setActiveTab] = useState<"individual" | "team" | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ActiveEvent | null>(null);
  const [isPending, startTransition] = useTransition();

  // Get dynamic categories from initialEvents
  const categories = Array.from(
    new Set(initialEvents.map((event) => event.category.name))
  ).sort();

  // Rango de estado para ordenar: menor = aparece primero.
  // Refleja la misma lógica de estado que EventCard, sin tocar la BD.
  // 0 = Inscripción abierta, 1 = En curso, 2 = Cerrado/Plazo vencido/Cupos llenos, 3 = Finalizado
  const getStatusRank = (event: ActiveEvent): number => {
    const now = new Date();
    const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
    const isDeadlinePassed = deadline ? deadline < now : false;
    const isFull =
      event.maxParticipants !== null && event.currentRegistrations >= event.maxParticipants;
    const isFinished = event.status === "FINISHED";
    const isInProgress = event.status === "IN_PROGRESS";
    const isOpen = event.isActive && !isDeadlinePassed && !isFull && !isFinished;

    if (isOpen) return 0;
    if (isInProgress) return 1;
    if (isFinished) return 3;
    return 2; // Inscripción cerrada, plazo vencido o cupos llenos
  };

  // Toggle type filter: pressing the active chip again clears the filter
  const handleTabChange = (tab: "individual" | "team") => {
    startTransition(() => {
      setActiveTab((prev) => (prev === tab ? null : tab));
    });
  };

  // Filter events based on active tab, search query, and category
  const filteredEvents = initialEvents.filter((event) => {
    // 1. Filter by type only when one is explicitly selected
    if (activeTab !== null) {
      const isTeam = event.type === "TEAM";
      if (activeTab === "individual" && isTeam) return false;
      if (activeTab === "team" && !isTeam) return false;
    }

    // 2. Filter by Search Query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchName = event.name.toLowerCase().includes(query);
      const matchDesc = (event.description || "").toLowerCase().includes(query);
      const matchCat = event.category.name.toLowerCase().includes(query);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    // 3. Filter by Category Badge
    if (selectedCategory && event.category.name !== selectedCategory) {
      return false;
    }

    return true;
  });

  // Ordenar por estado: abiertos primero, finalizados al final (sin tocar la BD).
  // Empate de estado -> abiertos por fecha más próxima; finalizados por fecha más reciente.
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const rankA = getStatusRank(a);
    const rankB = getStatusRank(b);
    if (rankA !== rankB) return rankA - rankB;

    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    // Finalizados (rank 3): más reciente primero. Resto: más próximo primero.
    return rankA === 3 ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="w-full space-y-6">
      {/* Search Input and Filters */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-brand-sky/50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar Eventos..."
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

        {/* Sliding Categories Badges (Horizontal scroll on mobile) */}
        <div className="w-full overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "snap-start shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl border transition-all duration-150 active:scale-95 min-h-[36px]",
                selectedCategory === null
                  ? "bg-brand-blue border-brand-sky/40 text-white shadow-md font-bold"
                  : "bg-brand-dark/40 border-brand-blue/25 text-white/60 hover:text-white hover:border-brand-blue/50"
              )}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "snap-start shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl border transition-all duration-150 active:scale-95 min-h-[36px]",
                  selectedCategory === category
                    ? "bg-brand-blue border-brand-sky/40 text-white shadow-md font-bold"
                    : "bg-brand-dark/40 border-brand-blue/25 text-white/60 hover:text-white hover:border-brand-blue/50"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Type filter chips — start with no selection (shows all events) */}
      <div className="flex items-center gap-2">
        {/* Optional label */}
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-white/30">
          Tipo:
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange("individual")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-150 active:scale-95 min-h-[36px]",
              activeTab === "individual"
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md"
                : "bg-brand-dark/40 border-brand-blue/25 text-white/50 hover:text-white hover:border-brand-blue/50"
            )}
          >
            {activeTab === "individual" ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Individual
              </span>
            ) : "Individual"}
          </button>
          <button
            onClick={() => handleTabChange("team")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-150 active:scale-95 min-h-[36px]",
              activeTab === "team"
                ? "bg-brand-sky/20 border-brand-sky/40 text-brand-sky shadow-md"
                : "bg-brand-dark/40 border-brand-blue/25 text-white/50 hover:text-white hover:border-brand-blue/50"
            )}
          >
            {activeTab === "team" ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-sky" />
                En Equipo
              </span>
            ) : "En Equipo"}
          </button>
        </div>
      </div>

      {/* Events List Container */}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 transition-opacity duration-200", isPending ? "opacity-60" : "opacity-100")}>
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onViewDetails={() => setSelectedEvent(event)}
            />
          ))
        ) : (
          /* Elegant Empty State */
          <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center py-12 px-4 border border-brand-blue/20 rounded-2xl bg-brand-navy/40 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-zinc-300">No se encontraron eventos</h4>
            <p className="mt-1.5 text-sm text-zinc-500 max-w-xs leading-relaxed">
              No hay actividades activas que coincidan con la búsqueda o los filtros seleccionados.
            </p>
            {(searchQuery || selectedCategory || activeTab) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setActiveTab(null);
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-brand-blue/60 border border-brand-blue/30 rounded-xl text-brand-light-gray hover:bg-brand-blue transition-all active:scale-95"
              >
                Restaurar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
