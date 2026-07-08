// src/app/admin/ferias/FeriasManager.tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ImageUploadField } from "../eventos/ImageUploadField";
import { feriaSchema, type FeriaInput } from "@/modules/ferias/schema";
import { upsertFeria, deleteFeria, updateFeriaStatus } from "@/modules/ferias/actions";

interface FeriaData {
  id: string;
  name: string;
  description: string | null;
  cost: string;
  dates: string;
  registrationUrl: string | null;
  imageBase64: string | null;
  isActive: boolean;
  encargados: {
    id: string;
    name: string;
    phone: string;
    whatsappUrl: string;
    userId: string | null;
  }[];
}

interface SystemUser {
  id: string;
  name: string;
  username: string;
  phone: string;
  role: string;
}

interface FeriasManagerProps {
  initialFerias: FeriaData[];
  systemUsers: SystemUser[];
  currentUserId?: string;
  currentUserRole: "ADMIN" | "COORDINATOR";
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Error al procesar la imagen."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

export function FeriasManager({
  initialFerias,
  systemUsers,
  currentUserId,
  currentUserRole,
}: FeriasManagerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingFeria, setEditingFeria] = useState<FeriaData | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Image states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [markedImageForDeletion, setMarkedImageForDeletion] = useState(false);

  // Selected coordinators in the form
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    setError,
  } = useForm<any>({
    resolver: zodResolver(feriaSchema),
    defaultValues: {
      name: "",
      description: "",
      cost: "Gratuito",
      dates: "",
      registrationUrl: "",
      isActive: true,
      imageBase64: null,
      encargadoUserIds: [],
    },
  });

  const handleNewFeria = () => {
    setEditingFeria(null);
    setGeneralError(null);
    setSelectedImageFile(null);
    setMarkedImageForDeletion(false);
    setSelectedUserIds([]);
    reset({
      name: "",
      description: "",
      cost: "Gratuito",
      dates: "",
      registrationUrl: "",
      isActive: true,
      imageBase64: null,
      encargadoUserIds: [],
    });
    setIsOpen(true);
  };

  const handleEditFeria = (feria: FeriaData) => {
    setEditingFeria(feria);
    setGeneralError(null);
    setSelectedImageFile(null);
    setMarkedImageForDeletion(false);

    const linked = feria.encargados.filter((e) => !!e.userId).map((e) => e.userId as string);
    setSelectedUserIds(linked);

    reset({
      id: feria.id,
      name: feria.name,
      description: feria.description || "",
      cost: feria.cost,
      dates: feria.dates,
      registrationUrl: feria.registrationUrl || "",
      isActive: feria.isActive,
      imageBase64: feria.imageBase64,
      encargadoUserIds: linked,
    });
    setIsOpen(true);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const onSubmit = async (data: any) => {
    setGeneralError(null);

    startTransition(async () => {
      try {
        let imageBase64String = data.imageBase64;

        if (selectedImageFile) {
          imageBase64String = await fileToBase64(selectedImageFile);
        } else if (markedImageForDeletion) {
          imageBase64String = null;
        }

        const finalData = {
          ...data,
          imageBase64: imageBase64String,
          encargadoUserIds: selectedUserIds,
        };

        const response = await upsertFeria(finalData);

        if (!response.success) {
          setGeneralError(response.error ?? "Error desconocido al guardar la feria.");
          if (response.fieldErrors) {
            Object.entries(response.fieldErrors).forEach(([field, messages]) => {
              setError(field as any, { message: messages?.[0] });
            });
          }
          return;
        }

        setIsOpen(false);
        setEditingFeria(null);
        setSelectedImageFile(null);
        setMarkedImageForDeletion(false);
        setSelectedUserIds([]);
        reset();
        router.refresh();
      } catch (err: any) {
        setGeneralError(err.message || "Error al codificar imagen.");
      }
    });
  };

  const handleDeleteFeria = (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la feria "${name}"?\nEsta acción es irreversible.`)) return;
    startTransition(async () => {
      const response = await deleteFeria(id);
      if (!response.success) {
        alert(response.error || "Error al intentar eliminar la feria.");
      } else {
        router.refresh();
      }
    });
  };

  const handleStatusToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const response = await updateFeriaStatus(id, !currentStatus);
      if (!response.success) {
        alert(response.error || "Error al actualizar estado.");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans selection:bg-brand-sky selection:text-brand-navy">
      <AdminHeader />

      <main className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
        {/* Header */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest">
              {currentUserRole === "COORDINATOR" ? "Vista de Coordinador" : "Consola de Ferias"}
            </span>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Feria y Emprendimientos
            </h2>
          </div>

          {currentUserRole === "ADMIN" && (
            <button
              onClick={handleNewFeria}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-sky text-brand-navy text-xs font-bold hover:brightness-110 shadow-lg shadow-brand-sky/10 active:scale-95 transition-all min-h-[40px] shrink-0 w-full sm:w-auto"
            >
              <span>+ Nueva Feria</span>
            </button>
          )}
        </section>

        {/* Ferias list */}
        <section className="space-y-4">
          {initialFerias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-brand-blue/20 rounded-2xl bg-brand-navy/30 text-center">
              <span className="text-brand-sky/40 mb-3">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 15.75h.75a.75.75 0 00.75-.75v-.75a.75.75 0 00-.75-.75h-.75a.75.75 0 00-.75.75v.75c0 .414.336.75.75.75z" />
                </svg>
              </span>
              <h4 className="text-sm font-bold text-zinc-300">No hay ferias registradas</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                {currentUserRole === "ADMIN"
                  ? "Crea tu primer emprendimiento haciendo clic en el botón superior."
                  : "No tienes ferias asignadas como encargado."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialFerias.map((feria) => (
                <article
                  key={feria.id}
                  className="p-4 rounded-2xl bg-brand-dark/45 border border-brand-blue/20 flex flex-col gap-3.5 hover:border-brand-blue/40 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      {feria.imageBase64 && (
                        <img
                          src={`data:image/webp;base64,${feria.imageBase64}`}
                          alt={feria.name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-brand-blue/20"
                        />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">
                          {feria.name}
                        </h3>
                        <p className="text-[10px] text-brand-sky/70 font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {feria.cost}
                          </span>
                          <span className="text-brand-blue/40">·</span>
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3 shrink-0 text-brand-sky" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {feria.dates}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStatusToggle(feria.id, feria.isActive)}
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border transition-colors shrink-0 ${
                        feria.isActive
                          ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {feria.isActive ? "Activo" : "Oculto"}
                    </button>
                  </div>

                  {feria.description && (
                    <p className="text-xs text-brand-light-gray/70 line-clamp-2 leading-relaxed">
                      {feria.description}
                    </p>
                  )}

                  {/* Coordinators */}
                  {feria.encargados.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9px] font-bold text-brand-sky/40 uppercase tracking-wider mr-1">
                        Encargados:
                      </span>
                      {feria.encargados.map((e) => (
                        <span
                          key={e.id}
                          className="px-2 py-0.5 bg-brand-navy/60 border border-brand-blue/35 text-white/80 rounded-lg text-[10px]"
                        >
                          {e.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 border-t border-brand-blue/15 pt-3">
                    <button
                      onClick={() => handleEditFeria(feria)}
                      className="px-3 py-1.5 rounded-xl bg-brand-blue/20 text-brand-sky hover:bg-brand-blue/35 text-xs font-semibold transition-all min-h-[32px]"
                    >
                      Editar
                    </button>

                    {currentUserRole === "ADMIN" && (
                      <button
                        onClick={() => handleDeleteFeria(feria.id, feria.name)}
                        className="px-3 py-1.5 rounded-xl bg-rose-550/10 text-rose-450 hover:bg-rose-550/20 text-xs font-semibold transition-all min-h-[32px] ml-auto"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Editor Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-brand-dark border border-brand-blue/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 pb-3 border-b border-brand-blue/20 shrink-0">
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                {editingFeria ? "Editar Feria" : "Nueva Feria / Emprendimiento"}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-none">
                {generalError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>{generalError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="name">
                    Título del Emprendimiento
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Ej. Feria Gastronómica Informática"
                    {...register("name")}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                  />
                  {errors.name?.message && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {errors.name.message as string}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="description">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Describe la feria, stands, etc."
                    {...register("description")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                  />
                </div>

                {/* Cost & Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="cost">
                      Costo
                    </label>
                    <input
                      id="cost"
                      type="text"
                      placeholder="Ej. Gratuito, 10 Bs."
                      {...register("cost")}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="dates">
                      Fechas
                    </label>
                    <input
                      id="dates"
                      type="text"
                      placeholder="Ej. 08 al 10 de Julio"
                      {...register("dates")}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                    />
                    {errors.dates?.message && (
                      <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                        {errors.dates.message as string}
                      </p>
                    )}
                  </div>
                </div>

                {/* External Registration Link */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80" htmlFor="registrationUrl">
                    Enlace de Inscripción Externo (opcional)
                  </label>
                  <input
                    id="registrationUrl"
                    type="url"
                    placeholder="Ej. https://forms.gle/..."
                    {...register("registrationUrl")}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white placeholder:text-brand-sky/30 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky transition-all"
                  />
                  {errors.registrationUrl?.message && (
                    <p className="text-[10px] text-rose-500 font-semibold" role="alert">
                      {errors.registrationUrl.message as string}
                    </p>
                  )}
                </div>

                {/* Image Upload */}
                <ImageUploadField
                  value={editingFeria?.imageBase64 || null}
                  onChange={(file) => {
                    setSelectedImageFile(file);
                    if (file === null) {
                      setMarkedImageForDeletion(true);
                    }
                  }}
                  onRemoveExisting={() => setMarkedImageForDeletion(true)}
                />

                {/* Coordinators */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80">
                    Encargados
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
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-3 border-t border-brand-blue/15 bg-brand-dark/80 shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 min-h-[44px] rounded-xl border border-brand-blue/30 text-brand-sky text-xs font-bold hover:bg-brand-blue/10 active:scale-95 transition-all"
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 min-h-[44px] rounded-xl bg-gradient-to-tr from-brand-blue to-brand-sky text-brand-navy text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-sky/10 flex items-center justify-center"
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="w-5 h-5 rounded-full border-2 border-brand-navy border-t-transparent animate-spin" />
                  ) : editingFeria ? (
                    "Guardar Cambios"
                  ) : (
                    "Crear Feria"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
