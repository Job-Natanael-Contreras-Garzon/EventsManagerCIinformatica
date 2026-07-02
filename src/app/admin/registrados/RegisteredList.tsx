// src/app/admin/registrados/RegisteredList.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { logoutAction } from "@/modules/auth/actions/auth.actions";


interface EventInfo {
  id: string;
  name: string;
}

interface RegistrationData {
  id: string;
  confirmationCode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  eventId: string;
  participantId: string;
  teamId: string | null;
  event: {
    id: string;
    name: string;
    description: string | null;
  };
  participant: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    registerCode: string;
  };
  team: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface RegisteredListProps {
  initialRegistrations: RegistrationData[];
  events: EventInfo[];
}

interface ColumnOption {
  key: string;
  label: string;
}

const ALL_COLUMNS: ColumnOption[] = [
  { key: "fullName", label: "Nombre" },
  { key: "registerCode", label: "Código Univ." },
  { key: "email", label: "Correo" },
  { key: "phone", label: "Teléfono" },
  { key: "registrationType", label: "Tipo" },
  { key: "teamInfo", label: "Equipo" },
  { key: "confirmationCode", label: "Cód. Confirmación" },
  { key: "date", label: "Fecha" },
];

export function RegisteredList({ initialRegistrations, events }: RegisteredListProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("Layout");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [printingEventId, setPrintingEventId] = useState<string | null>(null);

  // Default search term should actually be empty, let's fix that
  useState(() => {
    setSearchTerm("");
  });

  // Manage collapsed state for each tournament section
  const [collapsedEventIds, setCollapsedEventIds] = useState<string[]>([]);

  // Column visibility state: starts with essential columns visible
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>([
    "fullName",
    "registerCode",
    "email",
    "phone",
    "registrationType",
    "teamInfo",
  ]);

  // Toggle collapse state for a tournament
  const toggleCollapse = (eventId: string) => {
    setCollapsedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  // Toggle a column key in the visible set
  const toggleColumn = (key: string) => {
    setVisibleColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Filter registrations based on selected event and search term
  const filteredRegistrations = useMemo(() => {
    return initialRegistrations.filter((reg) => {
      const matchesEvent = selectedEvent === "all" || reg.eventId === selectedEvent;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        searchTerm === "" ||
        reg.participant.fullName.toLowerCase().includes(searchLower) ||
        (reg.participant.email || "").toLowerCase().includes(searchLower) ||
        reg.participant.phone.toLowerCase().includes(searchLower) ||
        reg.participant.registerCode.toLowerCase().includes(searchLower) ||
        (reg.team?.name || "").toLowerCase().includes(searchLower) ||
        (reg.team?.code || "").toLowerCase().includes(searchLower) ||
        reg.confirmationCode.toLowerCase().includes(searchLower);

      return matchesEvent && matchesSearch;
    });
  }, [initialRegistrations, selectedEvent, searchTerm]);

  // Group filtered registrations by tournament to allow visualization "por evento"
  const groupedRegistrations = useMemo(() => {
    const groups: { [eventId: string]: { eventName: string; registrations: RegistrationData[] } } = {};
    
    filteredRegistrations.forEach((reg) => {
      if (!groups[reg.eventId]) {
        groups[reg.eventId] = {
          eventName: reg.event.name,
          registrations: [],
        };
      }
      groups[reg.eventId].registrations.push(reg);
    });

    return groups;
  }, [filteredRegistrations]);

  // Export specific event registrations to CSV (Excel compatible)
  const handleExportCSV = async (eventId: string, eventName: string) => {
    setIsExporting(true);
    // Simulate compilation delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // Find active headers
      const activeColumns = ALL_COLUMNS.filter((col) =>
        visibleColumnKeys.includes(col.key)
      );
      const headers = activeColumns.map((col) => col.label);

      // Filter to just registrations belonging to the targeted event
      const eventRegistrations = filteredRegistrations.filter((r) => r.eventId === eventId);

      // Build rows dynamically based on visible columns
      const rows = eventRegistrations.map((reg) => {
        const rowData: string[] = [];
        if (visibleColumnKeys.includes("fullName")) {
          rowData.push(reg.participant.fullName);
        }
        if (visibleColumnKeys.includes("registerCode")) {
          rowData.push(reg.participant.registerCode);
        }
        if (visibleColumnKeys.includes("email")) {
          rowData.push(reg.participant.email || "");
        }
        if (visibleColumnKeys.includes("phone")) {
          rowData.push(reg.participant.phone);
        }
        if (visibleColumnKeys.includes("registrationType")) {
          rowData.push(reg.teamId ? "Equipo" : "Individual");
        }
        if (visibleColumnKeys.includes("teamInfo")) {
          rowData.push(reg.team ? `${reg.team.name} (${reg.team.code})` : "-");
        }
        if (visibleColumnKeys.includes("confirmationCode")) {
          rowData.push(reg.confirmationCode);
        }
        if (visibleColumnKeys.includes("date")) {
          rowData.push(new Date(reg.createdAt).toLocaleDateString("es-ES"));
        }
        return rowData;
      });

      const csvContent = [
        "sep=;",
        headers.join(";"),
        ...rows.map((row) =>
          row
            .map((val) => `"${String(val).replace(/"/g, '""')}"`)
            .join(";")
        ),
      ].join("\n");

      // Add UTF-8 BOM so Excel decodes Spanish accents and ñ correctly
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      const suffix = eventName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      
      link.setAttribute("href", url);
      link.setAttribute("download", `inscritos_${suffix}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("CSV Export error", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Trigger print view targeting only the clicked event
  const handlePrintPDF = async (eventId: string) => {
    setIsExporting(true);
    setPrintingEventId(eventId);
    // Let the spinner render before launching print dialog
    await new Promise((resolve) => setTimeout(resolve, 600));
    try {
      window.print();
    } catch (error) {
      console.error("Print error", error);
    } finally {
      setPrintingEventId(null);
      setIsExporting(false);
    }
  };

  // Filter grouped items for the print-only document
  const eventsToPrint = useMemo(() => {
    if (printingEventId) {
      return Object.entries(groupedRegistrations).filter(([id]) => id === printingEventId);
    }
    return Object.entries(groupedRegistrations);
  }, [groupedRegistrations, printingEventId]);

  // Find current active event name for layout subtitles
  const activeEventName = useMemo(() => {
    if (selectedEvent === "all") return "Todos los Torneos";
    return events.find((e) => e.id === selectedEvent)?.name || "Torneo Seleccionado";
  }, [selectedEvent, events]);

  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans print:hidden" />
    );
  }

  return (
    <>
      {/* ──────────────────────────────────────────────────────── */}
      {/* A. CLIENT INTERACTION AREA (Dark Theme / Standard View)  */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="min-h-screen w-full bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans selection:bg-brand-sky selection:text-brand-navy print:hidden">
        
        {/* Sticky Premium Header with Navigation for Admin Functions */}
        <header className="sticky top-0 z-40 w-full max-w-lg bg-brand-navy/80 backdrop-blur-md border-b border-brand-blue/35 px-4 py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-sky flex items-center justify-center font-bold text-sm text-brand-navy shadow-md shadow-brand-sky/20">
                AD
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                  Admin Panel
                </h1>
                <span className="text-[10px] text-brand-sky/60 font-medium uppercase">
                  CI INGENIERÍA INFORMÁTICA
                </span>
              </div>
            </div>
            
            <div className="sm:hidden">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px] flex items-center px-2 cursor-pointer border-0 bg-transparent"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>

          {/* Admin Navigation Hub Links */}
          <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-brand-blue/20 pt-2 sm:border-0 sm:pt-0">
            <nav className="flex items-center gap-2">
              <Link
                href="/admin/dashboard"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-sky/75 hover:text-brand-sky hover:bg-brand-blue/20 border border-transparent transition-all min-h-[32px] flex items-center"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/eventos"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-sky/75 hover:text-brand-sky hover:bg-brand-blue/20 border border-transparent transition-all min-h-[32px] flex items-center"
              >
                Eventos
              </Link>
              <Link
                href="/admin/registrados"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-sky bg-brand-sky/10 border border-brand-sky/20 pointer-events-none"
              >
                Registrados
              </Link>
              <Link
                href="/admin/usuarios"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-sky/75 hover:text-brand-sky hover:bg-brand-blue/20 border border-transparent transition-all min-h-[32px] flex items-center"
              >
                Usuarios
              </Link>
            </nav>
            
            <form action={logoutAction} className="hidden sm:block">
              <button
                type="submit"
                className="hidden sm:inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-sky/75 hover:text-white bg-brand-dark/65 border border-brand-blue/30 hover:bg-brand-blue/40 active:scale-95 transition-all min-h-[32px] cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </header>

        {/* Main Console Content */}
        <main className="w-full max-w-lg px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
          
          {/* Title Area */}
          <section className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest">
              Base de Datos
            </span>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Participantes
            </h2>
          </section>

          {/* Filtering Console */}
          <section className="p-4 rounded-2xl bg-brand-dark/45 border border-brand-blue/30 space-y-4">
            <div className="flex flex-col gap-3">
              {/* Event Selector (Dropdown) */}
              <div className="flex-1">
                <label htmlFor="event-filter" className="block text-[10px] font-bold uppercase tracking-wider text-brand-sky/60 mb-1.5">
                  Filtrar por Torneo
                </label>
                <div className="relative">
                  <select
                    id="event-filter"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full bg-brand-navy/60 border border-brand-blue/35 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky appearance-none min-h-[44px]"
                  >
                    <option value="all">Mostrar Todos los Torneos</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Text Search Input */}
              <div className="flex-1">
                <label htmlFor="search-text" className="block text-[10px] font-bold uppercase tracking-wider text-brand-sky/60 mb-1.5">
                  Buscar Participante o Equipo
                </label>
                <div className="relative">
                  <input
                    id="search-text"
                    type="text"
                    placeholder="Escribe nombre, correo, código o equipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-navy/60 border border-brand-blue/35 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-brand-sky/40 focus-visible:outline-none focus-visible:border-brand-sky focus-visible:ring-1 focus-visible:ring-brand-sky min-h-[44px]"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-sky/45">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Column Tags (Pills for showing/hiding columns) */}
              <div className="space-y-2 pt-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-sky/70">
                  Columnas de Reporte (Tags)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_COLUMNS.map((col) => {
                    const isVisible = visibleColumnKeys.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer min-h-[30px] ${
                          isVisible
                            ? "text-brand-sky bg-brand-sky/10 border border-brand-sky/20"
                            : "text-brand-sky/50 bg-brand-dark/60 border border-brand-blue/30 hover:text-brand-sky hover:bg-brand-blue/40"
                        }`}
                      >
                        {col.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter Metadata */}
            <div className="flex items-center justify-between text-[11px] text-brand-light-gray/80 font-semibold pt-1">
              <span>Filtro: <span className="text-brand-sky font-bold">{activeEventName}</span></span>
              <span className="bg-brand-navy/65 border border-brand-blue/30 px-2 py-0.5 rounded-md text-brand-light-gray">
                {filteredRegistrations.length} inscritos
              </span>
            </div>
          </section>

          {/* Exporting Spinner overlay */}
          {isExporting && (
            <div className="rounded-2xl border border-brand-sky/30 bg-brand-sky/5 p-4 flex items-center gap-3 animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-brand-sky border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-brand-sky">
                Compilando reporte con columnas seleccionadas...
              </p>
            </div>
          )}

          {/* Tables Grouped by Event */}
          <section className="flex flex-col gap-6">
            {Object.keys(groupedRegistrations).length > 0 ? (
              Object.entries(groupedRegistrations).map(([eventId, group]) => {
                const isCollapsed = collapsedEventIds.includes(eventId);
                return (
                  <article
                    key={eventId}
                    className="p-4 rounded-2xl bg-brand-dark/45 border border-brand-blue/30 flex flex-col gap-4 overflow-hidden"
                  >
                    {/* Collapsible Header Container */}
                    <div className="flex flex-col gap-2.5 pb-2.5 border-b border-brand-blue/20 sm:flex-row sm:items-center sm:justify-between">
                      
                      {/* Collapsible Trigger Label (Chevron + Title) */}
                      <div
                        onClick={() => toggleCollapse(eventId)}
                        className="flex items-center gap-2.5 cursor-pointer select-none group/title flex-1 min-w-0"
                        title={isCollapsed ? "Desplegar tabla" : "Colapsar tabla"}
                      >
                        <div className="p-1.5 rounded-lg bg-brand-navy/60 border border-brand-blue/20 flex items-center justify-center group-hover/title:border-zinc-700 transition-colors shrink-0">
                          <svg
                            className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                              isCollapsed ? "-rotate-90" : "rotate-0"
                            }`}
                            fill="none;;"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-brand-sky uppercase tracking-widest block">
                            Torneo / Categoría
                          </span>
                          <h3 className="text-sm font-black text-white tracking-tight leading-snug truncate group-hover/title:text-zinc-200 transition-colors">
                            {group.eventName}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Action buttons (Excel / PDF) */}
                      <div className="flex items-center gap-1.5 self-start sm:self-center">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-brand-navy/60 border border-brand-blue/20 text-brand-sky/70 whitespace-nowrap">
                          {group.registrations.length} inscritos
                        </span>
                        
                        {/* Excel Button */}
                        <button
                          onClick={() => handleExportCSV(eventId, group.eventName)}
                          disabled={isExporting}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none min-h-[30px]"
                          title="Exportar este torneo a Excel"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Excel</span>
                        </button>

                        {/* PDF Button */}
                        <button
                          onClick={() => handlePrintPDF(eventId)}
                          disabled={isExporting}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-brand-sky bg-brand-sky/10 border border-brand-sky/20 hover:bg-brand-sky/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none min-h-[30px]"
                          title="Imprimir / Exportar este torneo a PDF"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Table Body (collapsible wrapper) */}
                    <div
                      className={`transition-all duration-300 ease-in-out origin-top overflow-hidden ${
                        isCollapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[1000px] opacity-100"
                      }`}
                    >
                      {/* Horizontal scrollable table container for mobile adaptability */}
                      <div className="w-full overflow-x-auto scrollbar-none rounded-xl">
                        <table className="w-full text-left border-collapse min-w-[640px]">
                          <thead>
                            <tr className="border-b border-brand-blue/20 text-[10px] font-bold uppercase tracking-wider text-brand-sky/60">
                              <th className="py-2.5 pl-1 w-8 text-center">Nº</th>
                              {visibleColumnKeys.includes("fullName") && <th className="py-2.5 pr-2">Participante</th>}
                              {visibleColumnKeys.includes("registerCode") && <th className="py-2.5 pr-2 font-mono">Registro/CU</th>}
                              {visibleColumnKeys.includes("email") && <th className="py-2.5 pr-2">Correo</th>}
                              {visibleColumnKeys.includes("phone") && <th className="py-2.5 pr-2">Teléfono</th>}
                              {visibleColumnKeys.includes("registrationType") && <th className="py-2.5 text-center pr-2">Tipo</th>}
                              {visibleColumnKeys.includes("teamInfo") && <th className="py-2.5 pr-2 text-right">Equipo / Código</th>}
                              {visibleColumnKeys.includes("confirmationCode") && <th className="py-2.5 text-right font-mono pr-2">Cód. Conf.</th>}
                              {visibleColumnKeys.includes("date") && <th className="py-2.5 text-right pr-1">Fecha</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900/60 text-xs">
                            {group.registrations.map((reg, idx) => (
                              <tr key={reg.id} className="hover:bg-brand-blue/15 transition-colors">
                                <td className="py-3 pl-1 text-center font-bold text-brand-sky/45">{idx + 1}</td>
                                
                                {visibleColumnKeys.includes("fullName") && (
                                  <td className="py-3 font-bold text-white pr-2 max-w-[140px] truncate" title={reg.participant.fullName}>
                                    {reg.participant.fullName}
                                  </td>
                                )}

                                {visibleColumnKeys.includes("registerCode") && (
                                  <td className="py-3 font-mono text-brand-light-gray/90 pr-2 font-medium">
                                    {reg.participant.registerCode}
                                  </td>
                                )}

                                {visibleColumnKeys.includes("email") && (
                                  <td className="py-3 text-brand-sky/75 pr-2 max-w-[130px] truncate" title={reg.participant.email || ""}>
                                    {reg.participant.email || "-"}
                                  </td>
                                )}

                                {visibleColumnKeys.includes("phone") && (
                                  <td className="py-3 text-brand-light-gray pr-2 font-medium">
                                    {reg.participant.phone}
                                  </td>
                                )}

                                {visibleColumnKeys.includes("registrationType") && (
                                  <td className="py-3 text-center pr-2">
                                    {reg.teamId ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-brand-sky/15 text-brand-sky border border-brand-sky/25">
                                        Equipo
                                      </span>
                                    ) : (
                                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Indiv
                                      </span>
                                    )}
                                  </td>
                                )}

                                {visibleColumnKeys.includes("teamInfo") && (
                                  <td className="py-3 text-right pr-2 font-medium">
                                    {reg.team ? (
                                      <div>
                                        <span className="text-zinc-200 font-bold line-clamp-1">{reg.team.name}</span>
                                        <span className="block font-mono text-[9px] text-brand-sky tracking-wider mt-0.5">{reg.team.code}</span>
                                      </div>
                                    ) : (
                                      <span className="text-brand-sky/45">-</span>
                                    )}
                                  </td>
                                )}

                                {visibleColumnKeys.includes("confirmationCode") && (
                                  <td className="py-3 text-right font-mono text-brand-sky/50 pr-2">
                                    {reg.confirmationCode}
                                  </td>
                                )}

                                {visibleColumnKeys.includes("date") && (
                                  <td className="py-3 text-right text-brand-sky/50 whitespace-nowrap pr-1 font-mono">
                                    {new Date(reg.createdAt).toLocaleDateString("es-ES", {
                                      day: "2-digit",
                                      month: "numeric",
                                    })}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="text-center py-12 rounded-2xl bg-brand-dark/45 border border-brand-blue/30">
                <div className="w-10 h-10 rounded-full bg-brand-navy/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky/50 mx-auto mb-3">
                  <svg className="w-5 h-5 text-brand-sky/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-white">No se hallaron registros</h4>
                <p className="text-xs text-brand-sky/50 mt-1 px-4">
                  Prueba cambiando los filtros de selección, las columnas visibles o la búsqueda.
                </p>
              </div>
            )}
          </section>
        </main>
        
        {/* Floating Action Button for Public Catalog view */}
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href="/"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-brand-blue to-brand-sky text-brand-navy shadow-lg shadow-brand-sky/20 transition-all hover:scale-105 active:scale-95 border border-brand-sky/30 min-h-[48px] min-w-[48px] font-bold"
            title="Ver catálogo público"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* B. PRINT ONLY VIEW: High Fidelity Letterhead and Table  */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="hidden print:block w-full text-black bg-white font-sans text-[10px] p-2">
        {/* Official Header / Letterhead */}
        <header className="border-b-2 border-black pb-4 mb-6 flex items-start justify-between w-full">
          <div>
            <h1 className="text-base font-black tracking-tight text-black uppercase leading-tight">
              Centro Interno de Ingeniería Informática (CIII)
            </h1>
            <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-wide mt-0.5">
              Semana Universitaria 2026
            </p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none mt-0.5">
              Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones - UAGRM
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xs font-black text-black tracking-wider uppercase">
              Reporte Oficial de Inscritos
            </h2>
            <p className="text-[9px] text-zinc-650 font-mono mt-0.5">
              Fecha Impresión: {new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </header>

        {/* Filters Summary */}
        <section className="mb-4 bg-zinc-50 border border-zinc-200 p-3 rounded-lg flex items-center justify-between text-[11px]">
          <div>
            <span className="font-bold text-zinc-700">Filtro de Reporte: </span>
            <span className="text-zinc-950 font-black">{printingEventId ? events.find(e => e.id === printingEventId)?.name : activeEventName}</span>
          </div>
          <div>
            <span className="font-bold text-zinc-700">Total Participantes: </span>
            <span className="text-zinc-950 font-black">
              {printingEventId 
                ? (groupedRegistrations[printingEventId]?.registrations.length || 0)
                : filteredRegistrations.length
              } registrados
            </span>
          </div>
        </section>

        {/* Dynamic tables grouped by event for high-fidelity printing */}
        <div className="space-y-8">
          {eventsToPrint.length > 0 ? (
            eventsToPrint.map(([eventId, group]) => (
              <div key={eventId} className="space-y-2.5 page-break-inside-avoid">
                {/* Event printed subtitle */}
                <div className="border-b border-black pb-1.5 flex justify-between items-baseline">
                  <h3 className="text-xs font-extrabold text-black uppercase">
                    {group.eventName}
                  </h3>
                  <span className="text-[9px] font-bold text-zinc-550">
                    {group.registrations.length} registrados
                  </span>
                </div>

                <table className="w-full text-left border-collapse border border-zinc-300">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-400 text-[9px] font-bold text-zinc-800 uppercase">
                      <th className="p-2 border-r border-zinc-300 w-8 text-center">Nº</th>
                      {visibleColumnKeys.includes("fullName") && <th className="p-2 border-r border-zinc-300">Nombre Completo</th>}
                      {visibleColumnKeys.includes("registerCode") && <th className="p-2 border-r border-zinc-300">Registro CU</th>}
                      {visibleColumnKeys.includes("email") && <th className="p-2 border-r border-zinc-300">Correo</th>}
                      {visibleColumnKeys.includes("phone") && <th className="p-2 border-r border-zinc-300">Teléfono</th>}
                      {visibleColumnKeys.includes("registrationType") && <th className="p-2 border-r border-zinc-300 text-center">Tipo</th>}
                      {visibleColumnKeys.includes("teamInfo") && <th className="p-2 border-r border-zinc-300">Equipo (Código)</th>}
                      {visibleColumnKeys.includes("confirmationCode") && <th className="p-2 border-r border-zinc-300 text-right">Confirmación</th>}
                      {visibleColumnKeys.includes("date") && <th className="p-2 text-right">Fecha</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-[9px] text-zinc-900">
                    {group.registrations.map((reg, idx) => (
                      <tr key={reg.id} className="odd:bg-white even:bg-zinc-50/50">
                        <td className="p-2 border-r border-zinc-200 text-center font-bold text-zinc-500">{idx + 1}</td>
                        
                        {visibleColumnKeys.includes("fullName") && (
                          <td className="p-2 border-r border-zinc-200 font-extrabold">{reg.participant.fullName}</td>
                        )}

                        {visibleColumnKeys.includes("registerCode") && (
                          <td className="p-2 border-r border-zinc-200 font-mono font-bold">{reg.participant.registerCode}</td>
                        )}

                        {visibleColumnKeys.includes("email") && (
                          <td className="p-2 border-r border-zinc-200">{reg.participant.email || "-"}</td>
                        )}

                        {visibleColumnKeys.includes("phone") && (
                          <td className="p-2 border-r border-zinc-200 font-mono">{reg.participant.phone}</td>
                        )}

                        {visibleColumnKeys.includes("registrationType") && (
                          <td className="p-2 border-r border-zinc-200 text-center font-bold">
                            {reg.teamId ? "Equipo" : "Indiv"}
                          </td>
                        )}

                        {visibleColumnKeys.includes("teamInfo") && (
                          <td className="p-2 border-r border-zinc-200">
                            {reg.team ? (
                              <div>
                                <span className="font-bold">{reg.team.name}</span>
                                <span className="font-mono text-zinc-555 text-[8px] block">Cód: {reg.team.code}</span>
                              </div>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>
                        )}

                        {visibleColumnKeys.includes("confirmationCode") && (
                          <td className="p-2 border-r border-zinc-200 text-right font-mono font-medium">{reg.confirmationCode}</td>
                        )}

                        {visibleColumnKeys.includes("date") && (
                          <td className="p-2 text-right font-mono">
                            {new Date(reg.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-zinc-550 font-bold border border-zinc-300">
              No se registran participantes bajo los filtros actuales.
            </div>
          )}
        </div>

        {/* Printable Footer */}
        <footer className="mt-12 pt-4 border-t border-dotted border-zinc-300 text-center text-[9px] text-zinc-450">
          <p>Este documento es una copia física oficial de inscripciones compilada desde el portal de administración del CIII.</p>
          <p className="mt-0.5">© 2026 Centro Interno de Ingeniería Informática. Todos los derechos reservados.</p>
        </footer>
      </div>
    </>
  );
}
