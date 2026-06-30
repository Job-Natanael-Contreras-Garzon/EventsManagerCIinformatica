// src/app/admin/registrados/RegisteredList.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

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

export function RegisteredList({ initialRegistrations, events }: RegisteredListProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("Layout");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Default search term should actually be empty, let's fix that
  useState(() => {
    setSearchTerm("");
  });

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

  // Export filtered registrations to CSV (Excel compatible)
  const handleExportCSV = async () => {
    setIsExporting(true);
    // Simulate compilation delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const headers = [
        "Nombre Completo",
        "Correo Electrónico",
        "Teléfono",
        "Código Universitario",
        "Torneo",
        "Tipo de Registro",
        "Nombre de Equipo",
        "Código de Equipo",
        "Código de Confirmación",
        "Fecha de Registro",
      ];

      const rows = filteredRegistrations.map((reg) => [
        reg.participant.fullName,
        reg.participant.email || "",
        reg.participant.phone,
        reg.participant.registerCode,
        reg.event.name,
        reg.teamId ? "Equipo" : "Individual",
        reg.team?.name || "",
        reg.team?.code || "",
        reg.confirmationCode,
        new Date(reg.createdAt).toLocaleDateString("es-ES"),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((val) => `"${String(val).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      // Add UTF-8 BOM so Excel decodes Spanish accents and ñ correctly
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      const eventObj = events.find((e) => e.id === selectedEvent);
      const suffix = eventObj 
        ? eventObj.name.toLowerCase().replace(/[^a-z0-9]+/g, "_") 
        : "todos";
      
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

  // Trigger print view (configured for native high-fidelity PDF export via window.print)
  const handlePrintPDF = async () => {
    setIsExporting(true);
    // Let the spinner render before launching print dialog
    await new Promise((resolve) => setTimeout(resolve, 600));
    try {
      window.print();
    } catch (error) {
      console.error("Print error", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Find current active event name for layout subtitles
  const activeEventName = useMemo(() => {
    if (selectedEvent === "all") return "Todos los Torneos";
    return events.find((e) => e.id === selectedEvent)?.name || "Torneo Seleccionado";
  }, [selectedEvent, events]);

  return (
    <>
      {/* ──────────────────────────────────────────────────────── */}
      {/* A. CLIENT INTERACTION AREA (Dark Theme / Standard View)  */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="min-h-screen w-full bg-black text-zinc-150 flex flex-col items-center pb-safe font-sans selection:bg-violet-650 selection:text-white print:hidden">
        
        {/* Sticky Premium Header with Navigation for Admin Functions */}
        <header className="sticky top-0 z-40 w-full max-w-lg bg-black/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-violet-500/20">
                AD
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                  Admin Panel
                </h1>
                <span className="text-[10px] text-zinc-550 font-medium uppercase">
                  CI INGENIERÍA INFORMÁTICA
                </span>
              </div>
            </div>
            
            <div className="sm:hidden">
              <Link
                href="/admin/login"
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px] flex items-center px-2"
              >
                Salir
              </Link>
            </div>
          </div>

          {/* Admin Navigation Hub Links (correctly highlighting current view) */}
          <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-zinc-900 pt-2 sm:border-0 sm:pt-0">
            <nav className="flex items-center gap-2">
              <Link
                href="/admin/dashboard"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent transition-all min-h-[32px] flex items-center"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/eventos"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent transition-all min-h-[32px] flex items-center"
              >
                Eventos
              </Link>
              <Link
                href="/admin/registrados"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 pointer-events-none"
              >
                Registrados
              </Link>
            </nav>
            
            <Link
              href="/admin/login"
              className="hidden sm:inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-450 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 active:scale-95 transition-all min-h-[32px]"
            >
              Cerrar Sesión
            </Link>
          </div>
        </header>

        {/* Main Console Content */}
        <main className="w-full max-w-lg px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
          
          {/* Title Area and Export Toolbar */}
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                Base de Datos
              </span>
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                Participantes
              </h2>
            </div>

            {/* Export Toolbar (Excel and PDF) */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none min-h-[40px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Excel</span>
              </button>

              <button
                onClick={handlePrintPDF}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none min-h-[40px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>PDF / Imprimir</span>
              </button>
            </div>
          </section>

          {/* Filtering Console */}
          <section className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 space-y-4">
            <div className="flex flex-col gap-3">
              {/* Event Selector (Dropdown) */}
              <div className="flex-1">
                <label htmlFor="event-filter" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Filtrar por Torneo
                </label>
                <div className="relative">
                  <select
                    id="event-filter"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 appearance-none min-h-[44px]"
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

              {/* Text Search Input (Ad-hoc improvement for admin control) */}
              <div className="flex-1">
                <label htmlFor="search-text" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Buscar Participante o Equipo
                </label>
                <div className="relative">
                  <input
                    id="search-text"
                    type="text"
                    placeholder="Escribe nombre, correo, código o equipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-550 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 min-h-[44px]"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Count Indicator */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold pt-1">
              <span>Filtro: <span className="text-violet-400 font-bold">{activeEventName}</span></span>
              <span className="bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-md text-zinc-350">
                {filteredRegistrations.length} inscritos
              </span>
            </div>
          </section>

          {/* Export Loader Backdrop */}
          {isExporting && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-center gap-3 animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-violet-400">
                Compilando reporte e iniciando descarga...
              </p>
            </div>
          )}

          {/* Registered List Container */}
          <section className="flex flex-col gap-3">
            {filteredRegistrations.length > 0 ? (
              <>
                {/* 1. Mobile Layout: Card-based UI (screen-only, hidden on sm+) */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {filteredRegistrations.map((reg) => (
                    <article
                      key={reg.id}
                      className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 flex flex-col gap-3 relative overflow-hidden group hover:border-zinc-850 transition-all duration-300"
                    >
                      {/* Event Banner */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-900/60">
                        <span className="text-[10px] font-bold text-zinc-400 truncate max-w-[200px]">
                          {reg.event.name}
                        </span>
                        {reg.teamId ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-violet-650/10 text-violet-400 border border-violet-500/20">
                            Equipo
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Individual
                          </span>
                        )}
                      </div>

                      {/* Participant Main Info */}
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-extrabold text-white leading-none">
                          {reg.participant.fullName}
                        </h4>
                        <p className="text-xs font-mono font-semibold text-zinc-400">
                          CU: {reg.participant.registerCode}
                        </p>
                      </div>

                      {/* Contact Channels */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 font-medium">
                        <div className="truncate">
                          <span className="block text-[9px] font-bold text-zinc-600 uppercase">Correo</span>
                          <span className="text-zinc-400">{reg.participant.email || "-"}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-zinc-600 uppercase">Teléfono</span>
                          <span className="text-zinc-400">{reg.participant.phone}</span>
                        </div>
                      </div>

                      {/* Team details if applicable */}
                      {reg.team && (
                        <div className="mt-1 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850/80 flex items-center justify-between text-xs">
                          <div>
                            <span className="block text-[9px] font-bold text-violet-400 uppercase tracking-wider">Equipo</span>
                            <span className="font-bold text-zinc-300">{reg.team.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[9px] font-bold text-violet-400 uppercase tracking-wider">Código</span>
                            <span className="font-mono font-black text-white tracking-widest">{reg.team.code}</span>
                          </div>
                        </div>
                      )}

                      {/* Confirmation Code Footnote */}
                      <div className="mt-1 pt-2 border-t border-zinc-900/40 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>Cód: <span className="font-mono font-bold text-zinc-400">{reg.confirmationCode}</span></span>
                        <span>{new Date(reg.createdAt).toLocaleDateString("es-ES")}</span>
                      </div>
                    </article>
                  ))}
                </div>

                {/* 2. Desktop Layout: Table View (screen-only, hidden on mobile) */}
                <div className="hidden sm:block overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <th className="pb-3 pl-1">Participante</th>
                        <th className="pb-3">Contacto</th>
                        <th className="pb-3">Torneo</th>
                        <th className="pb-3 text-center">Registro</th>
                        <th className="pb-3 text-right">Equipo / Código</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60 text-xs">
                      {filteredRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-zinc-900/20 transition-colors">
                          {/* Name & register code */}
                          <td className="py-3.5 pl-1 pr-2">
                            <div className="font-bold text-white leading-none">{reg.participant.fullName}</div>
                            <span className="text-[10px] font-mono text-zinc-500 mt-1 block">CU: {reg.participant.registerCode}</span>
                          </td>
                          {/* Email & Phone */}
                          <td className="py-3.5 pr-2 max-w-[120px]">
                            <div className="text-zinc-350 truncate" title={reg.participant.email || ""}>
                              {reg.participant.email || "-"}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">{reg.participant.phone}</div>
                          </td>
                          {/* Event name */}
                          <td className="py-3.5 pr-2">
                            <span className="line-clamp-2 text-zinc-400 font-medium leading-tight">
                              {reg.event.name}
                            </span>
                          </td>
                          {/* Type */}
                          <td className="py-3.5 text-center">
                            {reg.teamId ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-violet-650/10 text-violet-400 border border-violet-500/20">
                                Equipo
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Individual
                              </span>
                            )}
                          </td>
                          {/* Team Name / Confirmation Code */}
                          <td className="py-3.5 text-right font-medium">
                            {reg.team ? (
                              <div>
                                <div className="text-zinc-200 font-bold truncate max-w-[110px] inline-block">{reg.team.name}</div>
                                <span className="block font-mono text-[10px] text-violet-400 tracking-wider mt-1">{reg.team.code}</span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-zinc-600">-</span>
                                <span className="block font-mono text-[9px] text-zinc-550 mt-1">Cód: {reg.confirmationCode}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12 rounded-2xl bg-zinc-950/40 border border-zinc-900">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto mb-3">
                  <svg className="w-5 h-5 text-zinc-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-white">No se hallaron registros</h4>
                <p className="text-xs text-zinc-500 mt-1 px-4">
                  Prueba cambiando los filtros de selección o la palabra de búsqueda.
                </p>
              </div>
            )}
          </section>
        </main>
        
        {/* Floating Action Button for Public Catalog view */}
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href="/"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-105 active:scale-95 border border-violet-500/30 min-h-[48px] min-w-[48px]"
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
      <div className="hidden print:block w-full text-black bg-white font-sans text-xs p-2">
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
            <span className="font-bold text-zinc-700">Torneo Seleccionado: </span>
            <span className="text-zinc-950 font-black">{activeEventName}</span>
          </div>
          <div>
            <span className="font-bold text-zinc-700">Total Participantes: </span>
            <span className="text-zinc-950 font-black">{filteredRegistrations.length} registrados</span>
          </div>
        </section>

        {/* Printable Data Table */}
        <table className="w-full text-left border-collapse border border-zinc-300">
          <thead>
            <tr className="bg-zinc-100 border-b border-zinc-400 text-[10px] font-bold text-zinc-800 uppercase">
              <th className="p-2 border-r border-zinc-300 w-8 text-center">Nº</th>
              <th className="p-2 border-r border-zinc-300">Nombre Completo</th>
              <th className="p-2 border-r border-zinc-300">Registro CU</th>
              <th className="p-2 border-r border-zinc-300">Contacto</th>
              <th className="p-2 border-r border-zinc-300">Torneo</th>
              <th className="p-2 border-r border-zinc-300 text-center">Tipo</th>
              <th className="p-2">Equipo (Código)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-[10px] text-zinc-900">
            {filteredRegistrations.length > 0 ? (
              filteredRegistrations.map((reg, idx) => (
                <tr key={reg.id} className="odd:bg-white even:bg-zinc-50/50">
                  <td className="p-2 border-r border-zinc-200 text-center font-bold text-zinc-650">{idx + 1}</td>
                  <td className="p-2 border-r border-zinc-200 font-extrabold">{reg.participant.fullName}</td>
                  <td className="p-2 border-r border-zinc-200 font-mono font-bold">{reg.participant.registerCode}</td>
                  <td className="p-2 border-r border-zinc-200 leading-tight">
                    <div>{reg.participant.email || "-"}</div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{reg.participant.phone}</div>
                  </td>
                  <td className="p-2 border-r border-zinc-200 leading-tight font-medium text-zinc-800">
                    {reg.event.name}
                  </td>
                  <td className="p-2 border-r border-zinc-200 text-center font-bold">
                    {reg.teamId ? "Equipo" : "Individual"}
                  </td>
                  <td className="p-2 font-semibold">
                    {reg.team ? (
                      <div>
                        <span>{reg.team.name}</span>
                        <span className="font-mono text-zinc-500 text-[9px] block">Cód: {reg.team.code}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 font-normal">-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-6 text-center text-zinc-550 font-bold">
                  No se registran participantes bajo los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Printable Footer */}
        <footer className="mt-12 pt-4 border-t border-dotted border-zinc-300 text-center text-[9px] text-zinc-450">
          <p>Este documento es una copia física oficial de inscripciones compilada desde el portal de administración del CIII.</p>
          <p className="mt-0.5">© 2026 Centro Interno de Ingeniería Informática. Todos los derechos reservados.</p>
        </footer>
      </div>
    </>
  );
}
