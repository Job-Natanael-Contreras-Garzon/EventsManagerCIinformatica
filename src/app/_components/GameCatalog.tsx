// src/app/_components/GameCatalog.tsx
"use client";

import { useState, useTransition } from "react";
import { ActiveEvent } from "@/modules/registration/types/event.types";
import { EventCard } from "@/components/EventCard";
import { cn } from "./utils";

interface GameCatalogProps {
  initialEvents: ActiveEvent[];
}

export function GameCatalog({ initialEvents }: GameCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"individual" | "team">("individual");
  const [isPending, startTransition] = useTransition();

  // Get dynamic categories from initialEvents
  const categories = Array.from(
    new Set(initialEvents.map((event) => event.category.name))
  ).sort();

  // Handle tab change with transition for smooth rendering
  const handleTabChange = (tab: "individual" | "team") => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  // Filter events based on active tab, search query, and category
  const filteredEvents = initialEvents.filter((event) => {
    // 1. Filter by Tab (Individual vs Team)
    const isTeam = event.type === "TEAM";
    if (activeTab === "individual" && isTeam) return false;
    if (activeTab === "team" && !isTeam) return false;

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

  return (
    <div className="w-full space-y-6">
      {/* Search Input and Filters */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar torneos o juegos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[48px] pl-11 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-transparent transition-all"
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
                  ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-950/20"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300"
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
                    ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-950/20"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team vs Individual Segmented Tabs */}
      <div className="grid grid-cols-2 p-1 bg-zinc-950 border border-zinc-850 rounded-xl">
        <button
          onClick={() => handleTabChange("individual")}
          className={cn(
            "w-full py-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150 active:scale-95 min-h-[44px]",
            activeTab === "individual"
              ? "bg-zinc-900 text-white border border-zinc-800 shadow-md"
              : "text-zinc-550 hover:text-zinc-300"
          )}
        >
          Individuales
        </button>
        <button
          onClick={() => handleTabChange("team")}
          className={cn(
            "w-full py-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150 active:scale-95 min-h-[44px]",
            activeTab === "team"
              ? "bg-zinc-900 text-white border border-zinc-800 shadow-md"
              : "text-zinc-550 hover:text-zinc-300"
          )}
        >
          En Equipo
        </button>
      </div>

      {/* Events List Container */}
      <div className={cn("grid grid-cols-1 gap-5 transition-opacity duration-200", isPending ? "opacity-60" : "opacity-100")}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          /* Elegant Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-zinc-900 rounded-2xl bg-zinc-950/40 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-zinc-300">No se encontraron eventos</h4>
            <p className="mt-1.5 text-sm text-zinc-500 max-w-xs leading-relaxed">
              No hay actividades activas que coincidan con la búsqueda o los filtros seleccionados.
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-all active:scale-95"
              >
                Restaurar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
