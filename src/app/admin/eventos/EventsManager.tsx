// src/app/admin/eventos/EventsManager.tsx
"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { DateTimePicker } from "./DateTimePicker";
import { eventSchema, type EventInput } from "@/modules/events/schema";
import { upsertEvent, deleteEvent, createCategory, deleteCategory, updateEventStatus, setEventWinner } from "@/modules/events/actions";
import { registerPlayerManually } from "@/modules/registration/actions-manual";
import { uploadEventImage, removeEventImage } from "@/modules/events/upload-image-action";
import { ImageUploadField } from "./ImageUploadField";
import { AdminHeader } from "@/components/admin/AdminHeader";

// ─── Sugerencias de campos dinámicos ────────────────────────────────────────
const FIELD_SUGGESTIONS = [
  "Costo de inscripción",
  "Lugar",
  "Requisitos",
  "Premios",
  "Horario",
  "Modalidad",
  "Plataforma",
  "Formato",
  "Clasificación",
  "Duración",
];

interface Category {
  id: string;
  name: string;
  _count?: { events: number };
}

interface SystemUser {
  id: string;
  name: string;
  username: string;
  phone: string;
  role: string;
}

interface EventData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  gender: string;
  date: Date;
  isActive: boolean;
  registrationDeadline: Date | null;
  maxParticipants: number | null;
  maxTeamMembers: number;
  imageBase64: string | null;
  categoryId: string;
  winnerName: string | null;
  whatsappGroupUrl: string | null;
  customFields: unknown;
  disabledFields: string[];
  category: { name: string };
  encargados?: {
    id: string;
    name: string;
    phone: string;
    whatsappUrl: string;
    userId: string | null;
  }[];
  _count: { registrations: number; teams: number };
}

interface EventsManagerProps {
  initialEvents: EventData[];
  categories: Category[];
  systemUsers: SystemUser[];
  currentUserId?: string;
  currentUserRole: "ADMIN" | "COORDINATOR";
}

// Helper for date formatting in datetime-local inputs (timezone-safe)
function toDatetimeLocalString(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

function parseCustomFields(raw: unknown): { label: string; value: string }[] {
  if (!raw) return [];
  try {
    if (typeof raw === "string") return JSON.parse(raw);
    if (Array.isArray(raw)) return raw as { label: string; value: string }[];
  } catch { return []; }
  return [];
}

const EVENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: "Disponible", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
  IN_PROGRESS: { label: "En Curso", color: "text-brand-sky bg-brand-sky/10 border-brand-sky/25" },
  FINISHED: { label: "Finalizado", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
};

export function EventsManager({
  initialEvents,
  categories,
  systemUsers,
  currentUserId,
  currentUserRole,
}: EventsManagerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [markedImageForDeletion, setMarkedImageForDeletion] = useState(false);

  const [activeTab, setActiveTab] = useState<"torneos" | "categorias">("torneos");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCategoryPending, startCategoryTransition] = useTransition();

  // Selected encargados (userIds) in the form
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Custom fields in form
  const [customFields, setCustomFields] = useState<{ label: string; value: string }[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const newFieldLabelRef = useRef<HTMLInputElement>(null);

  // Winner modal state
  const [winnerModalEvent, setWinnerModalEvent] = useState<EventData | null>(null);
  const [winnerName, setWinnerName] = useState("");
  const [isWinnerPending, startWinnerTransition] = useTransition();

  // Status change state
  const [isStatusPending, startStatusTransition] = useTransition();

  // Manual registration modal
  const [manualRegEvent, setManualRegEvent] = useState<EventData | null>(null);
  const [isManualRegPending, startManualTransition] = useTransition();
  const [manualRegError, setManualRegError] = useState<string | null>(null);
  const [manualRegSuccess, setManualRegSuccess] = useState<string | null>(null);
  const [manualRegForm, setManualRegForm] = useState({
    fullName: "",
    registerCode: "",
    email: "",
    phone: "",
    teamName: "",
    teamCode: "",
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
    setError,
    watch,
    control,
  } = useForm<any>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "INDIVIDUAL",
      status: "AVAILABLE",
      gender: "BOTH",
      categoryId: categories[0]?.id || "",
      maxParticipants: null,
      maxTeamMembers: 5,
      imageBase64: null,
      isActive: true,
      date: new Date(Date.now() + 86400000).toISOString(),
      registrationDeadline: "",
      winnerName: "",
      whatsappGroupUrl: "",
      customFields: [],
      disabledFields: [],
      encargadoUserIds: [],
    },
  });

  const selectedType = watch("type");

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategoryError(null);
    startCategoryTransition(async () => {
      const response = await createCategory({ name: newCategoryName });
      if (!response.success) {
        setCategoryError(response.error || "Ocurrió un error al crear la categoría.");
        if (response.fieldErrors?.name) {
          setCategoryError(response.fieldErrors.name[0]);
        }
      } else {
        setNewCategoryName("");
        router.refresh();
      }
    });
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) return;
    startCategoryTransition(async () => {
      const response = await deleteCategory(id);
      if (!response.success) {
        alert(response.error || "Ocurrió un error al eliminar la categoría.");
      } else {
        router.refresh();
      }
    });
  };

  const buildEventDefaults = (): Partial<EventInput> => ({
    name: "",
    description: "",
    type: "INDIVIDUAL",
    status: "AVAILABLE",
    gender: "BOTH",
    categoryId: categories[0]?.id || "",
    maxParticipants: null,
    maxTeamMembers: 5,
    imageBase64: null,
    isActive: true,
    date: new Date(Date.now() + 86400000).toISOString(),
    registrationDeadline: "",
    winnerName: "",
    whatsappGroupUrl: "",
    customFields: [],
    disabledFields: [],
    encargadoUserIds: [],
  });

  const handleNewEvent = () => {
    setEditingEvent(null);
    setGeneralError(null);
    setSelectedImageFile(null);
    setMarkedImageForDeletion(false);
    setSelectedUserIds([]);
    setCustomFields([]);
    setNewFieldLabel("");
    setNewFieldValue("");
    reset(buildEventDefaults());
    setIsOpen(true);
  };

  const handleEditEvent = (event: EventData) => {
    setEditingEvent(event);
    setGeneralError(null);
    setSelectedImageFile(null);
    setMarkedImageForDeletion(false);

    // Pre-select encargados linked to users
    const linked = (event.encargados ?? []).filter((e) => !!e.userId).map((e) => e.userId as string);
    setSelectedUserIds(linked);

    // Parse custom fields
    const fields = parseCustomFields(event.customFields);
    setCustomFields(fields);
    setNewFieldLabel("");
    setNewFieldValue("");

    reset({
      id: event.id,
      name: event.name,
      description: event.description || "",
      type: event.type as "INDIVIDUAL" | "TEAM" | "OPEN",
      status: (event.status as "AVAILABLE" | "IN_PROGRESS" | "FINISHED") ?? "AVAILABLE",
      gender: (event.gender as "WOMEN" | "MEN" | "BOTH") ?? "BOTH",
      categoryId: event.categoryId,
      maxParticipants: event.maxParticipants,
      maxTeamMembers: event.maxTeamMembers ?? 5,
      imageBase64: event.imageBase64,
      isActive: event.isActive,
      date: new Date(event.date).toISOString(),
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString() : "",
      winnerName: event.winnerName || "",
      whatsappGroupUrl: event.whatsappGroupUrl || "",
      customFields: fields,
      disabledFields: event.disabledFields ?? [],
      encargadoUserIds: linked,
    });
    setIsOpen(true);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const updated = [...customFields, { label: newFieldLabel.trim(), value: newFieldValue.trim() }];
    setCustomFields(updated);
    setValue("customFields", updated);
    setNewFieldLabel("");
    setNewFieldValue("");
    newFieldLabelRef.current?.focus();
  };

  const removeCustomField = (index: number) => {
    const updated = customFields.filter((_, i) => i !== index);
    setCustomFields(updated);
    setValue("customFields", updated);
  };

  const onSubmit = (data: any) => {
    setGeneralError(null);
    // Inject selected user IDs and custom fields
    const finalData = {
      ...data,
      encargadoUserIds: selectedUserIds,
      customFields,
    };

    startTransition(async () => {
      const response = await upsertEvent(finalData);

      if (!response.success) {
        setGeneralError(response.error ?? "Error desconocido.");
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, messages]) => {
            setError(field as any, { message: messages?.[0] });
          });
        }
        return;
      }

      const savedEventId = response.data?.id;

      if (savedEventId) {
        if (selectedImageFile) {
          const formData = new FormData();
          formData.append("image", selectedImageFile);
          const uploadRes = await uploadEventImage(formData, savedEventId);
          if (!uploadRes.success) {
            setGeneralError(`El evento se guardó, pero hubo un problema con la imagen: ${uploadRes.error}`);
            return;
          }
        } else if (markedImageForDeletion) {
          const deleteRes = await removeEventImage(savedEventId);
          if (!deleteRes.success) {
            setGeneralError(`El evento se guardó, pero no se pudo eliminar la imagen: ${deleteRes.error}`);
            return;
          }
        }
      }

      setIsOpen(false);
      setEditingEvent(null);
      setSelectedImageFile(null);
      setMarkedImageForDeletion(false);
      setSelectedUserIds([]);
      setCustomFields([]);
      reset();
      router.refresh();
    });
  };

  const handleDeleteEvent = (id: string, name: string) => {
    if (!window.confirm(`¿Estás completamente seguro de eliminar el torneo "${name}"?\nEsta acción es irreversible.`)) return;
    startTransition(async () => {
      const response = await deleteEvent(id);
      if (!response.success) {
        alert(response.error || "Error al intentar eliminar el torneo.");
      } else {
        router.refresh();
      }
    });
  };

  const handleStatusChange = (eventId: string, status: "AVAILABLE" | "IN_PROGRESS" | "FINISHED") => {
    startStatusTransition(async () => {
      const res = await updateEventStatus(eventId, status);
      if (!res.success) alert(res.error ?? "Error al cambiar el estado.");
      else router.refresh();
    });
  };

  const handleSetWinner = () => {
    if (!winnerModalEvent) return;
    startWinnerTransition(async () => {
      const res = await setEventWinner(winnerModalEvent.id, winnerName || null);
      if (!res.success) alert(res.error ?? "Error al establecer el ganador.");
      else {
        setWinnerModalEvent(null);
        setWinnerName("");
        router.refresh();
      }
    });
  };

  const handleManualRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRegEvent) return;
    setManualRegError(null);
    setManualRegSuccess(null);

    startManualTransition(async () => {
      const res = await registerPlayerManually({
        ...manualRegForm,
        eventId: manualRegEvent.id,
      });
      if (res.success) {
        setManualRegSuccess(`✅ Registrado correctamente. Código: ${res.data?.confirmationCode}`);
        setManualRegForm({ fullName: "", registerCode: "", email: "", phone: "", teamName: "", teamCode: "" });
        router.refresh();
      } else {
        setManualRegError(res.error ?? "Error al registrar al participante.");
      }
    });
  };

  if (!mounted) {
    return <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans" />;
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans selection:bg-brand-sky selection:text-brand-navy">
      
      <AdminHeader />

      <main className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
        
        {/* Title Area */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest">
              {currentUserRole === "COORDINATOR" ? "Mis Eventos Asignados" : "Configuración de Torneos"}
            </span>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Gestión de Eventos
            </h2>
          </div>
          
          {activeTab === "torneos" && currentUserRole === "ADMIN" && (
            <button
              onClick={handleNewEvent}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-blue/80 hover:bg-brand-blue active:scale-95 transition-all min-h-[40px] shadow-md border border-brand-sky/20 w-full sm:w-auto shrink-0"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Torneo
            </button>
          )}
        </section>

        {/* Tabs — solo admin ve la pestaña de categorías */}
        <div className="flex bg-brand-dark/50 border border-brand-blue/25 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("torneos")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all min-h-[38px] ${
              activeTab === "torneos"
                ? "bg-brand-sky text-brand-navy shadow-lg shadow-brand-sky/15"
                : "text-brand-sky/60 hover:text-white hover:bg-brand-blue/15"
            }`}
          >
            Torneos
          </button>
          {currentUserRole === "ADMIN" && (
            <button
              onClick={() => setActiveTab("categorias")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all min-h-[38px] ${
                activeTab === "categorias"
                  ? "bg-brand-sky text-brand-navy shadow-lg shadow-brand-sky/15"
                  : "text-brand-sky/60 hover:text-white hover:bg-brand-blue/15"
              }`}
            >
              Categorías
            </button>
          )}
        </div>

        {/* Torneos View */}
        {activeTab === "torneos" && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialEvents.length > 0 ? (
              initialEvents.map((event) => {
                const isTeam = event.type === "TEAM";
                const count = isTeam ? event._count.teams : event._count.registrations;
                const max = event.maxParticipants;
                const occupancyText = max ? `${count}/${max}` : `${count}/∞`;
                const statusInfo = EVENT_STATUS_LABELS[event.status] ?? EVENT_STATUS_LABELS.AVAILABLE;
                const isCompetitive = event.type !== "OPEN";

                return (
                  <article
                    key={event.id}
                    className="p-4 rounded-2xl bg-brand-dark/70 border border-brand-blue/20 flex flex-col gap-3 hover:border-brand-blue/35 transition-all duration-150"
                  >
                    {/* Badge line */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-dark/60 border border-brand-blue/20 text-white/60">
                        {event.category.name}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isTeam ? "bg-brand-sky/15 border-brand-sky/25 text-brand-sky"
                          : event.type === "OPEN" ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}>
                        {event.type === "OPEN" ? "ABIERTO" : isTeam ? "EQUIPO" : "INDIVIDUAL"}
                      </span>
                      {/* Estado del evento */}
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${statusInfo.color}`}>
                        {event.status === "IN_PROGRESS" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
                        {statusInfo.label}
                      </span>
                      {/* Inscripciones abiertas/cerradas */}
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        event.isActive ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${event.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        {event.isActive ? "Inscripciones abiertas" : "Inscripciones cerradas"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1">{event.name}</h3>
                        {isCompetitive && (
                          <p className="text-[11px] text-white/40">
                            Ocupación: <span className="font-mono text-brand-light-gray font-semibold">{occupancyText}</span>{" "}
                            {isTeam ? "Equipos" : "Jugadores"}
                          </p>
                        )}
                        {event.winnerName && (
                          <p className="text-[11px] text-amber-400 font-semibold mt-0.5">🏆 {event.winnerName}</p>
                        )}
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-brand-blue/15">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-brand-blue/40 border border-brand-blue/20 hover:bg-brand-blue/60 active:scale-95 transition-all min-h-[36px]"
                      >
                        Editar
                      </button>

                      {/* Cambiar estado */}
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusChange(event.id, e.target.value as "AVAILABLE" | "IN_PROGRESS" | "FINISHED")}
                        disabled={isStatusPending}
                        className="px-2 py-1 rounded-xl text-[10px] font-bold bg-brand-navy/60 border border-brand-blue/25 text-brand-light-gray min-h-[36px] appearance-none cursor-pointer"
                        title="Cambiar estado"
                      >
                        <option value="AVAILABLE">Disponible</option>
                        <option value="IN_PROGRESS">En Curso</option>
                        <option value="FINISHED">Finalizado</option>
                      </select>

                      {/* Ganador (solo torneos competitivos) */}
                      {isCompetitive && (
                        <button
                          onClick={() => {
                            setWinnerModalEvent(event);
                            setWinnerName(event.winnerName || "");
                          }}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-amber-400 border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all min-h-[36px]"
                          title="Establecer ganador"
                        >
                          🏆 Ganador
                        </button>
                      )}

                      {/* Registro manual */}
                      {isCompetitive && (
                        <button
                          onClick={() => {
                            setManualRegEvent(event);
                            setManualRegError(null);
                            setManualRegSuccess(null);
                            setManualRegForm({ fullName: "", registerCode: "", email: "", phone: "", teamName: "", teamCode: "" });
                          }}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition-all min-h-[36px]"
                          title="Añadir registro manual"
                        >
                          + Registro
                        </button>
                      )}

                      {/* Eliminar — solo admin */}
                      {currentUserRole === "ADMIN" && (
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.name)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 transition-all min-h-[36px]"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="p-10 rounded-2xl bg-zinc-950/40 border border-zinc-900 text-center text-xs text-zinc-500 font-medium">
                {currentUserRole === "COORDINATOR"
                  ? "No tienes eventos asignados actualmente."
                  : "No hay torneos registrados. ¡Crea uno nuevo arriba!"}
              </div>
            )}
          </section>
        )}

        {/* Categorías View — Admin only */}
        {activeTab === "categorias" && currentUserRole === "ADMIN" && (
          <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-5 p-5 rounded-2xl bg-brand-dark/70 border border-brand-blue/20 flex flex-col gap-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-sky/80">
                Crear Nueva Categoría
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => { setNewCategoryName(e.target.value); setCategoryError(null); }}
                  placeholder="Ej. Juegos de Mesa"
                  className="flex-1 min-h-[44px] px-3.5 bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all rounded-xl"
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={isCategoryPending || !newCategoryName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-brand-navy bg-brand-sky hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-all min-h-[44px] shrink-0"
                >
                  {isCategoryPending ? "Creando..." : "Crear"}
                </button>
              </div>
              {categoryError && <p className="text-[10px] text-rose-500 font-semibold" role="alert">{categoryError}</p>}
            </div>

            <div className="md:col-span-7 flex flex-col gap-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-sky/60 px-1">
                Categorías Existentes
              </h3>
              {categories.length > 0 ? (
                categories.map((cat) => {
                  const hasEvents = cat._count && cat._count.events > 0;
                  return (
                    <article key={cat.id} className="p-4 rounded-2xl bg-brand-dark/70 border border-brand-blue/20 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white tracking-tight truncate">{cat.name}</h4>
                        <p className="text-[11px] text-white/40">
                          {cat._count?.events === 1 ? "1 torneo asociado" : `${cat._count?.events || 0} torneos asociados`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        disabled={!!hasEvents}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                          hasEvents
                            ? "bg-brand-navy/30 text-white/20 border border-brand-blue/10 cursor-not-allowed opacity-45"
                            : "text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95"
                        }`}
                        title={hasEvents ? "No se puede eliminar porque contiene torneos asociados." : "Eliminar categoría"}
                      >
                        Eliminar
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="p-10 rounded-2xl bg-zinc-950/40 border border-zinc-900 text-center text-xs text-zinc-500 font-medium">
                  No hay categorías registradas.
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ─── Modal: Winner ─────────────────────────────────────────────────── */}
      {winnerModalEvent && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setWinnerModalEvent(null)} />
          <div className="fixed inset-x-0 bottom-0 max-w-lg mx-auto bg-brand-dark border-t border-amber-500/30 rounded-t-3xl z-50 px-6 pt-4 pb-10 shadow-2xl max-h-[60vh] overflow-y-auto flex flex-col md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:border-amber-500/30 md:max-h-[90vh]">
            <div className="w-12 h-1 bg-amber-500/30 rounded-full mx-auto mb-5 md:hidden" />
            <h3 className="text-lg font-black tracking-tight text-white mb-1">🏆 Establecer Ganador</h3>
            <p className="text-xs text-brand-sky/60 mb-5">{winnerModalEvent.name}</p>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold text-brand-sky/60 uppercase tracking-wider">
                Nombre del ganador o equipo (dejar vacío para quitar)
              </label>
              <input
                type="text"
                value={winnerName}
                onChange={(e) => setWinnerName(e.target.value)}
                placeholder="Ej. Equipo Alpha / Juan Pérez"
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-sm focus:outline-none focus:border-amber-500/60 transition-all"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setWinnerModalEvent(null)}
                  className="flex-1 py-2.5 rounded-xl border border-brand-blue/30 text-brand-sky text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSetWinner}
                  disabled={isWinnerPending}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-brand-navy font-bold text-xs active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  {isWinnerPending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Modal: Registro Manual ──────────────────────────────────────────── */}
      {manualRegEvent && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setManualRegEvent(null)} />
          <div className="fixed inset-x-0 bottom-0 max-w-lg mx-auto bg-brand-dark border-t border-brand-blue/25 rounded-t-3xl z-50 px-6 pt-4 pb-10 shadow-2xl max-h-[88vh] overflow-y-auto flex flex-col md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:border-brand-blue/25 md:max-h-[90vh]">
            <div className="w-12 h-1 bg-brand-blue/30 rounded-full mx-auto mb-5 md:hidden" />
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">Registro Manual</h3>
                <p className="text-xs text-brand-sky/60">{manualRegEvent.name}</p>
              </div>
              <button
                onClick={() => setManualRegEvent(null)}
                className="w-8 h-8 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleManualRegSubmit} className="space-y-3 flex-1" noValidate>
              {manualRegError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-medium">{manualRegError}</div>
              )}
              {manualRegSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">{manualRegSuccess}</div>
              )}

              {[
                { label: "Nombre Completo", key: "fullName", placeholder: "Ej. Juan Pérez", type: "text", required: true },
                { label: "Código Universitario", key: "registerCode", placeholder: "Ej. 20231234", type: "text", required: true },
                { label: "Celular", key: "phone", placeholder: "Ej. 70000000", type: "tel", required: true },
                { label: "Correo (opcional)", key: "email", placeholder: "Ej. juan@email.com", type: "email", required: false },
              ].map(({ label, key, placeholder, type, required }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-sky/60 uppercase tracking-wider">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    required={required}
                    value={manualRegForm[key as keyof typeof manualRegForm]}
                    onChange={(e) => setManualRegForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky/60 transition-all"
                  />
                </div>
              ))}

              {manualRegEvent.type === "TEAM" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-brand-sky/60 uppercase tracking-wider">Nombre del Equipo (nuevo)</label>
                    <input
                      type="text"
                      placeholder="Ej. Equipo Alpha"
                      value={manualRegForm.teamName}
                      onChange={(e) => setManualRegForm((prev) => ({ ...prev, teamName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky/60 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-brand-sky/60 uppercase tracking-wider">Código de Equipo Existente</label>
                    <input
                      type="text"
                      placeholder="Ej. A8B2C4"
                      value={manualRegForm.teamCode}
                      onChange={(e) => setManualRegForm((prev) => ({ ...prev, teamCode: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky/60 transition-all"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3 border-t border-brand-blue/20">
                <button
                  type="button"
                  onClick={() => setManualRegEvent(null)}
                  className="flex-1 py-2.5 rounded-xl border border-brand-blue/30 text-brand-sky text-xs font-bold"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={isManualRegPending}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky text-brand-navy font-bold text-xs active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  {isManualRegPending ? (
                    <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                  ) : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ─── Main Event Form Modal ───────────────────────────────────────────── */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 max-w-lg mx-auto bg-brand-dark border-t border-brand-blue/25 rounded-t-3xl z-50 px-6 pt-4 pb-10 shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:border-brand-blue/25 md:max-h-[90vh] md:w-full md:max-w-xl">
            <div className="w-12 h-1 bg-brand-blue/30 rounded-full mx-auto mb-5 shrink-0 md:hidden" />

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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
              <input type="hidden" {...register("id")} />

              {generalError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-medium leading-relaxed">
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
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                />
                {(errors.name as any)?.message && (
                  <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                    {(errors.name as any).message}
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
                  className="w-full min-h-[80px] p-3.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                />
              </div>

              {/* Categoría, Tipo, Género */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="categoryId">Categoría</label>
                  <select id="categoryId" {...register("categoryId")} className="w-full min-h-[44px] px-3 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all appearance-none">
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {(errors.categoryId as any)?.message && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {(errors.categoryId as any).message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="type">Tipo</label>
                  <select id="type" {...register("type")} className="w-full min-h-[44px] px-3 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all appearance-none">
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="TEAM">Equipo</option>
                    <option value="OPEN">Abierto</option>
                  </select>
                  {(errors.type as any)?.message && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {(errors.type as any).message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="gender">Género</label>
                  <select id="gender" {...register("gender")} className="w-full min-h-[44px] px-3 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all appearance-none">
                    <option value="BOTH">Mixto</option>
                    <option value="WOMEN">Femenino</option>
                    <option value="MEN">Masculino</option>
                  </select>
                </div>
              </div>

              {/* Estado y control de inscripciones */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="status">Estado del Evento</label>
                  <select id="status" {...register("status")} className="w-full min-h-[44px] px-3 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all appearance-none">
                    <option value="AVAILABLE">Disponible</option>
                    <option value="IN_PROGRESS">En Curso</option>
                    <option value="FINISHED">Finalizado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="isActive">Inscripciones</label>
                  <select
                    id="isActive"
                    {...register("isActive", { setValueAs: (val) => val === "true" || val === true })}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all appearance-none"
                  >
                    <option value="true">Abiertas</option>
                    <option value="false">Cerradas</option>
                  </select>
                </div>
              </div>

              {/* Cupos */}
              <div className={`grid gap-3 ${selectedType === "TEAM" ? "grid-cols-2" : "grid-cols-1"}`}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="maxParticipants">
                    {selectedType === "TEAM" ? "Máximo de Equipos" : "Máximo de Cupos"} (vacío = ilimitado)
                  </label>
                  <input
                    id="maxParticipants"
                    type="number"
                    placeholder="Ej. 16"
                    {...register("maxParticipants", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                  />
                  {(errors.maxParticipants as any)?.message && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {(errors.maxParticipants as any).message}
                    </p>
                  )}
                </div>

                {selectedType === "TEAM" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="maxTeamMembers">
                      Integrantes/Equipo
                    </label>
                    <input
                      id="maxTeamMembers"
                      type="number"
                      placeholder="Ej. 5"
                      {...register("maxTeamMembers", { setValueAs: (v) => (v === "" || v === null || v === undefined ? 5 : Number(v)) })}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <DateTimePicker
                      label="Fecha del Evento"
                      value={field.value}
                      onChange={field.onChange}
                      error={(errors.date as any)?.message}
                      align="left"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="registrationDeadline"
                  render={({ field }) => (
                    <DateTimePicker
                      label="Límite Registro"
                      value={field.value}
                      onChange={field.onChange}
                      error={(errors.registrationDeadline as any)?.message}
                      align="right"
                    />
                  )}
                />
              </div>

              {/* Ganador opcional */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="winnerName">
                  Ganador/Equipo Ganador (opcional)
                </label>
                <input
                  id="winnerName"
                  type="text"
                  placeholder="Ej. Equipo Alpha"
                  {...register("winnerName")}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                />
              </div>

              {/* Enlace de Grupo de WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="whatsappGroupUrl">
                  Enlace del Grupo de WhatsApp (opcional)
                </label>
                <input
                  id="whatsappGroupUrl"
                  type="url"
                  placeholder="Ej. https://chat.whatsapp.com/..."
                  {...register("whatsappGroupUrl")}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                />
                {(errors.whatsappGroupUrl as any)?.message && (
                  <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                    {(errors.whatsappGroupUrl as any).message}
                  </p>
                )}
              </div>

              {/* Encargados — Selector de usuarios del sistema */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80">
                  Encargados del Torneo
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-brand-navy/40 border border-brand-blue/20">
                  {systemUsers.length === 0 ? (
                    <p className="text-[10px] text-brand-sky/40 py-2 text-center">No hay usuarios registrados.</p>
                  ) : (
                    systemUsers.map((u) => {
                      const selected = selectedUserIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUserSelection(u.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                            selected
                              ? "bg-brand-sky/15 border border-brand-sky/30 text-white"
                              : "bg-brand-navy/30 border border-transparent text-brand-light-gray/70 hover:bg-brand-navy/50"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            selected ? "bg-brand-sky border-brand-sky" : "border-brand-blue/40"
                          }`}>
                            {selected && (
                              <svg className="w-2.5 h-2.5 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="font-semibold">{u.name}</span>
                          <span className="text-brand-sky/50 ml-auto">{u.role === "COORDINATOR" ? "Coord." : "Admin"}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Campos Dinámicos */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80">
                  Características Dinámicas
                </span>

                {/* Lista de campos añadidos */}
                {customFields.length > 0 && (
                  <div className="space-y-2">
                    {customFields.map((field, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-navy/40 border border-brand-blue/20">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-brand-sky/60 block">{field.label}</span>
                          <span className="text-xs text-white/70 truncate">{field.value}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomField(i)}
                          className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 transition-colors shrink-0"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Añadir nuevo campo */}
                <div className="p-3 rounded-xl bg-brand-navy/30 border border-brand-blue/15 space-y-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase">Nombre del campo</label>
                    {/* Input con datalist de sugerencias */}
                    <input
                      ref={newFieldLabelRef}
                      type="text"
                      list="field-suggestions"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Ej. Costo de inscripción"
                      className="w-full min-h-[36px] px-3 rounded-lg bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-brand-sky/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                    />
                    <datalist id="field-suggestions">
                      {FIELD_SUGGESTIONS.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase">Valor</label>
                    <input
                      type="text"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomField(); } }}
                      placeholder="Ej. 10 Bs"
                      className="w-full min-h-[36px] px-3 rounded-lg bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-brand-sky/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addCustomField}
                    disabled={!newFieldLabel.trim()}
                    className="w-full py-2 rounded-lg text-[10px] font-bold text-brand-navy bg-brand-sky/80 hover:bg-brand-sky disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-all"
                  >
                    + Añadir Campo
                  </button>
                </div>
              </div>

              {/* Arte Promocional */}
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
                  className="flex items-center justify-center w-full min-h-[44px] rounded-xl bg-brand-navy border border-brand-blue/30 text-brand-sky hover:bg-brand-navy/80 text-sm font-semibold transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || isSubmitting}
                  className="flex items-center justify-center w-full min-h-[44px] rounded-xl bg-brand-sky text-brand-navy text-sm font-bold shadow-lg shadow-brand-sky/20 transition-all active:scale-95 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
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
