// src/app/admin/eventos/EventsManager.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { eventSchema, type EventInput } from "@/modules/events/schema";
import { upsertEvent, deleteEvent } from "@/modules/events/actions";
import { uploadEventImage, removeEventImage } from "@/modules/events/upload-image-action";
import { ImageUploadField } from "./ImageUploadField";

interface Category {
  id: string;
  name: string;
}

interface EventData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  date: Date;
  isActive: boolean;
  registrationDeadline: Date | null;
  maxParticipants: number | null;
  maxTeamMembers: number;
  imageBase64: string | null;
  categoryId: string;
  category: {
    name: string;
  };
  encargados?: {
    id: string;
    name: string;
    phone: string;
    whatsappUrl: string;
  }[];
  _count: {
    registrations: number;
    teams: number;
  };
}

interface EventsManagerProps {
  initialEvents: EventData[];
  categories: Category[];
}



// Helper for date formatting in datetime-local inputs (timezone-safe)
function toDatetimeLocalString(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function EventsManager({ initialEvents, categories }: EventsManagerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [markedImageForDeletion, setMarkedImageForDeletion] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "INDIVIDUAL",
      categoryId: categories[0]?.id || "",
      maxParticipants: null,
      maxTeamMembers: 5,
      imageBase64: null,
      isActive: true,
      date: toDatetimeLocalString(new Date(Date.now() + 86400000)), // tomorrow
      registrationDeadline: "",
      encargadoName: "",
      encargadoPhone: "",
    },
  });

  const selectedType = watch("type");

  // Handle open for creating new event
  const handleNewEvent = () => {
    setEditingEvent(null);
    setGeneralError(null);
    setSelectedImageFile(null);
    setMarkedImageForDeletion(false);
    reset({
      name: "",
      description: "",
      type: "INDIVIDUAL",
      categoryId: categories[0]?.id || "",
      maxParticipants: null,
      maxTeamMembers: 5,
      imageBase64: null,
      isActive: true,
      date: toDatetimeLocalString(new Date(Date.now() + 86400000)),
      registrationDeadline: "",
      encargadoName: "",
      encargadoPhone: "",
    });
    setIsOpen(true);
  };

  // Handle open for editing event
  const handleEditEvent = (event: EventData) => {
    setEditingEvent(event);
    setGeneralError(null);
    setSelectedImageFile(null);
    setMarkedImageForDeletion(false);
    
    const detectedType = event.type as "INDIVIDUAL" | "TEAM";
    const firstEncargado = event.encargados?.[0];
    
    reset({
      id: event.id,
      name: event.name,
      description: event.description || "",
      type: detectedType,
      categoryId: event.categoryId,
      maxParticipants: event.maxParticipants,
      maxTeamMembers: event.maxTeamMembers ?? 5,
      imageBase64: event.imageBase64,
      isActive: event.isActive,
      date: toDatetimeLocalString(event.date),
      registrationDeadline: event.registrationDeadline ? toDatetimeLocalString(event.registrationDeadline) : "",
      encargadoName: firstEncargado?.name || "",
      encargadoPhone: firstEncargado?.phone
        ? (firstEncargado.phone.startsWith("591") ? firstEncargado.phone.slice(3) : firstEncargado.phone)
        : "",
    });
    setIsOpen(true);
  };

  const onSubmit = (data: EventInput) => {
    setGeneralError(null);
    startTransition(async () => {
      // Step 1: Save event data (metadata)
      const response = await upsertEvent(data);

      if (!response.success) {
        setGeneralError(response.error);
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof EventInput, {
              message: messages?.[0],
            });
          });
        }
        return;
      }

      const savedEventId = response.data?.id;

      if (savedEventId) {
        // Step 2: Handle image upload if a file was selected
        if (selectedImageFile) {
          const formData = new FormData();
          formData.append("image", selectedImageFile);
          
          const uploadRes = await uploadEventImage(formData, savedEventId);
          if (!uploadRes.success) {
            setGeneralError(`El evento se guardó, pero hubo un problema con la imagen: ${uploadRes.error}`);
            return;
          }
        } 
        // Step 2b: Handle image deletion if user explicitly clicked remove
        else if (markedImageForDeletion) {
          const deleteRes = await removeEventImage(savedEventId);
          if (!deleteRes.success) {
            setGeneralError(`El evento se guardó, pero no se pudo eliminar la imagen anterior: ${deleteRes.error}`);
            return;
          }
        }
      }

      // Close and reset
      setIsOpen(false);
      setEditingEvent(null);
      setSelectedImageFile(null);
      setMarkedImageForDeletion(false);
      reset();
      router.refresh();
    });
  };

  const handleDeleteEvent = (id: string, name: string) => {
    const confirmed = window.confirm(
      `¿Estás completamente seguro de eliminar el torneo "${name}"?\nEsta acción es irreversible y eliminará todos los equipos y participantes inscritos en él.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const response = await deleteEvent(id);
      if (!response.success) {
        alert(response.error || "Ocurrió un error al intentar eliminar el torneo.");
      } else {
        router.refresh();
      }
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans" />
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans selection:bg-brand-sky selection:text-brand-navy">
      
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
              <span className="text-[10px] text-brand-sky/60 font-medium">
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
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-sky bg-brand-sky/10 border border-brand-sky/20 pointer-events-none"
            >
              Eventos
            </Link>
            <Link
              href="/admin/registrados"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-sky/75 hover:text-brand-sky hover:bg-brand-blue/20 border border-transparent transition-all min-h-[32px] flex items-center"
            >
              Registrados
            </Link>
          </nav>
          
          <Link
            href="/admin/login"
            className="hidden sm:inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-sky/75 hover:text-white bg-brand-dark/65 border border-brand-blue/30 hover:bg-brand-blue/40 active:scale-95 transition-all min-h-[32px]"
          >
            Cerrar Sesión
          </Link>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="w-full max-w-lg px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
        
        {/* Title Area with "+ Nuevo" Button */}
        <section className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest">
              Configuración de Torneos
            </span>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Gestión de Eventos
            </h2>
          </div>
          
          <button
            onClick={handleNewEvent}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-brand-navy bg-brand-sky hover:bg-brand-sky/90 active:scale-95 transition-all min-h-[40px] shadow-lg shadow-brand-sky/20"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Torneo
          </button>
        </section>

        {/* Compact List View */}
        <section className="flex flex-col gap-3">
          {initialEvents.length > 0 ? (
            initialEvents.map((event) => {
              const type = event.type;
              const isTeam = type === "TEAM";
              
              // Count current registrations
              const count = isTeam ? event._count.teams : event._count.registrations;
              const max = event.maxParticipants;
              const occupancyText = max ? `${count}/${max}` : `${count}/∞`;
              return (
                <article
                  key={event.id}
                  className="p-4 rounded-2xl bg-brand-dark/45 border border-brand-blue/30 flex items-center justify-between gap-4 hover:border-brand-blue/45 transition-all duration-150"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Badge line */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-navy/60 border border-brand-blue/30 text-brand-sky">
                        {event.category.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isTeam
                            ? "bg-brand-sky/15 border-brand-sky/25 text-brand-sky"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {isTeam ? "EQUIPO" : "INDIVIDUAL"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          event.isActive
                            ? "text-emerald-450"
                            : "text-rose-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${event.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        {event.isActive ? "Abierto" : "Cerrado"}
                      </span>
                    </div>

                    {/* Event Name */}
                    <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1">
                      {event.name}
                    </h3>
                    
                    {/* Occupancy details */}
                    <p className="text-[11px] text-brand-sky/60">
                      Ocupación: <span className="font-mono text-brand-light-gray font-semibold">{occupancyText}</span> {isTeam ? "Equipos" : "Jugadores"}
                    </p>
                  </div>

                  {/* Actions column */}
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-light-gray hover:text-white bg-brand-blue/60 border border-brand-blue/30 hover:bg-brand-blue/80 hover:border-brand-blue/40 active:scale-95 transition-all min-h-[36px]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id, event.name)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-350 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 transition-all min-h-[36px]"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="p-10 rounded-2xl bg-zinc-950/40 border border-zinc-900 text-center text-xs text-zinc-500 font-medium">
              No hay torneos registrados. ¡Crea uno nuevo arriba!
            </div>
          )}
        </section>
      </main>

      {/* Slide-Up Bottom Sheet Modal */}
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-brand-navy/80 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer sheet container */}
          <div className="fixed inset-x-0 bottom-0 max-w-lg mx-auto bg-brand-navy border-t border-brand-blue/35 rounded-t-3xl z-50 px-6 pt-4 pb-10 shadow-2xl transition-all duration-300 max-h-[88vh] overflow-y-auto flex flex-col">
            
            {/* Top native drag bar */}
            <div className="w-12 h-1 bg-brand-blue/30 rounded-full mx-auto mb-5 shrink-0" />

            {/* Header info */}
            <div className="mb-6 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">
                  {editingEvent ? "Editar Torneo" : "Crear Nuevo Torneo"}
                </h3>
                <p className="text-xs text-brand-sky/60">
                  {editingEvent ? "Modifica la configuración de este torneo" : "Completa la ficha técnica del nuevo torneo"}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
              <input type="hidden" {...register("id")} />
              
              {/* General action errors */}
              {generalError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-450 text-xs font-medium leading-relaxed">
                  {generalError}
                </div>
              )}

              {/* Título */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="name">
                  Título del Torneo
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Ej. Torneo de Valorant 5v5"
                  {...register("name")}
                  className="w-full min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                />
                {errors.name && (
                  <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="description">
                  Descripción
                </label>
                <textarea
                  id="description"
                  placeholder="Detalles sobre premios, modalidad, reglas..."
                  rows={3}
                  {...register("description")}
                  className="w-full min-h-[80px] p-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                />
                {errors.description && (
                  <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Categoría y Tipo de juego */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Categoría */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="categoryId">
                    Categoría
                  </label>
                  <select
                    id="categoryId"
                    {...register("categoryId")}
                    className="w-full min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all appearance-none"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>

                {/* Tipo de Juego */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="type">
                    Tipo de Juego
                  </label>
                  <select
                    id="type"
                    {...register("type")}
                    className="w-full min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all appearance-none"
                  >
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="TEAM">En Equipo</option>
                  </select>
                  {errors.type && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {errors.type.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Cupos y Estado */}
              <div className={`grid gap-4 ${selectedType === "TEAM" ? "grid-cols-3" : "grid-cols-2"}`}>
                
                {/* Máximo de cupos */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="maxParticipants">
                    {selectedType === "TEAM" ? "Máximo de Equipos" : "Máximo de Cupos"}
                  </label>
                  <input
                    id="maxParticipants"
                    type="number"
                    placeholder="Ej. 16 (vacío = ∞)"
                    {...register("maxParticipants", {
                      setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
                    })}
                    className="w-full min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                  />
                  {errors.maxParticipants && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {errors.maxParticipants.message}
                    </p>
                  )}
                </div>

                {/* Integrantes por Equipo (Condicional) */}
                {selectedType === "TEAM" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="maxTeamMembers">
                      Integrantes/Equipo
                    </label>
                    <input
                      id="maxTeamMembers"
                      type="number"
                      placeholder="Ej. 5"
                      {...register("maxTeamMembers", {
                        setValueAs: (v) => (v === "" || v === null || v === undefined ? 5 : Number(v)),
                      })}
                      className="w-full min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                    />
                    {errors.maxTeamMembers && (
                      <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                        {errors.maxTeamMembers.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Estado */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="isActive">
                    Inscripciones
                  </label>
                  <select
                    id="isActive"
                    {...register("isActive", {
                      setValueAs: (val) => val === "true" || val === true,
                    })}
                    className="w-full min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all appearance-none"
                  >
                    <option value="true">Abiertas</option>
                    <option value="false">Cerradas</option>
                  </select>
                  {errors.isActive && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {errors.isActive.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Fecha del evento */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="date">
                    Fecha del Evento
                  </label>
                  <input
                    id="date"
                    type="datetime-local"
                    {...register("date")}
                    className="w-full min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                  />
                  {errors.date && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                {/* Límite de registro */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="registrationDeadline">
                    Límite Registro
                  </label>
                  <input
                    id="registrationDeadline"
                    type="datetime-local"
                    {...register("registrationDeadline")}
                    className="w-full min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                  />
                  {errors.registrationDeadline && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {errors.registrationDeadline.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Encargado del Torneo */}
              <div className="grid grid-cols-2 gap-4">
                {/* Nombre del Encargado */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="encargadoName">
                    Nombre del Encargado
                  </label>
                  <input
                    id="encargadoName"
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    {...register("encargadoName")}
                    className="w-full min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                  />
                  {errors.encargadoName && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {errors.encargadoName.message}
                    </p>
                  )}
                </div>

                {/* Celular del Encargado */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="encargadoPhone">
                    Celular del Encargado
                  </label>
                  <input
                    id="encargadoPhone"
                    type="text"
                    placeholder="Ej. 70712345"
                    {...register("encargadoPhone")}
                    className="w-full min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                  />
                  {errors.encargadoPhone && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {errors.encargadoPhone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Arte Promocional / Flyer */}
              <div className="pt-2">
                <ImageUploadField
                  value={editingEvent?.imageBase64 || null}
                  onChange={(file) => setSelectedImageFile(file)}
                  onRemoveExisting={() => setMarkedImageForDeletion(true)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-full min-h-[44px] rounded-xl bg-brand-navy border border-brand-blue/30 text-brand-sky hover:bg-brand-navy/80 text-sm font-semibold transition-all duration-150 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || isSubmitting}
                  className="flex items-center justify-center w-full min-h-[44px] rounded-xl bg-brand-sky text-brand-navy text-sm font-bold shadow-lg shadow-brand-sky/20 transition-all duration-150 active:scale-95 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {isPending || isSubmitting ? "Guardando..." : editingEvent ? "Guardar Cambios" : "Crear Torneo"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
