"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserInput } from "@/modules/auth/schemas/auth.schema";
import { createUserAction, deleteUserAction } from "@/modules/auth/actions/auth.actions";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface UsersManagerProps {
  initialUsers: {
    id: string;
    name: string;
    username: string;
  }[];
}

export function UsersManager({ initialUsers }: UsersManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
  });

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al administrador "${userName}"?`)) {
      startTransition(async () => {
        const result = await deleteUserAction(userId);
        if (!result.success) {
          alert(result.error);
          return;
        }
        
        // Remove locally from state
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      });
    }
  };

  // Client-side local update in sync with Server revalidation
  const onSubmit = (data: CreateUserInput) => {
    setGeneralError(null);
    startTransition(async () => {
      const result = await createUserAction(data);

      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof CreateUserInput, {
              message: messages?.[0],
            });
          });
        } else {
          setGeneralError(result.error);
        }
        return;
      }

      // Añadir localmente para actualizar la UI rápido antes de la revalidación
      setUsers((prev) => [
        ...prev,
        {
          id: Math.random().toString(), // Temp ID
          name: data.name,
          username: data.username,
        },
      ].sort((a, b) => a.name.localeCompare(b.name)));

      reset();
      setIsOpen(false);
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans selection:bg-brand-sky selection:text-brand-navy relative">
      
      {/* Shared Admin Header with hamburger menu for mobile */}
      <AdminHeader />

      {/* Main Admin Content Container */}
      <main className="w-full max-w-lg px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
        
        {/* Title Area with "+ Nuevo" Button */}
        <section className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest">
              Seguridad del Sistema
            </span>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Cuentas de Administradores
            </h2>
          </div>
          
          <button
            onClick={() => {
              reset();
              setGeneralError(null);
              setIsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky hover:from-brand-sky hover:to-brand-sky text-brand-navy font-bold text-xs shadow-md shadow-brand-sky/10 active:scale-95 hover:shadow-brand-sky/20 transition-all cursor-pointer min-h-[36px]"
          >
            <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Nuevo</span>
          </button>
        </section>

        {/* User list */}
        <section className="flex flex-col gap-3">
          {users.map((user) => {
            const initials = user.name
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            return (
              <article
                key={user.id}
                className="p-4 rounded-2xl bg-brand-dark/45 border border-brand-blue/30 relative overflow-hidden group hover:border-brand-blue/50 transition-all duration-300 flex items-center justify-between"
              >
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-brand-sky/5 rounded-full blur-xl" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-navy border border-brand-blue/45 flex items-center justify-center font-black text-brand-sky text-xs select-none">
                    {initials || "AD"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{user.name}</h3>
                    <p className="text-xs text-brand-sky/70 mt-0.5">{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-brand-sky/40 border border-brand-blue/20 bg-brand-navy/30 px-2 py-1 rounded-md">
                    Admin
                  </span>
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    disabled={isPending}
                    className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500/80 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:scale-100"
                    title="Eliminar Administrador"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      {/* Slide-Up Bottom Sheet Modal for Creating User */}
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer sheet container */}
          <div className="fixed inset-x-0 bottom-0 max-w-lg mx-auto bg-brand-dark border-t border-brand-blue/25 rounded-t-3xl z-50 px-6 pt-4 pb-10 shadow-2xl transition-all duration-300 max-h-[88vh] overflow-y-auto flex flex-col">
            
            {/* Top native drag bar */}
            <div className="w-12 h-1 bg-brand-blue/30 rounded-full mx-auto mb-5 shrink-0" />

            {/* Header info */}
            <div className="mb-6 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">
                  Crear Nuevo Administrador
                </h3>
                <p className="text-xs text-brand-sky/60">
                  Registra una nueva cuenta de acceso a la consola operativa.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1" noValidate>
              
              {/* General action errors */}
              {generalError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-450 text-xs font-medium leading-relaxed">
                  {generalError}
                </div>
              )}

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="ej. Juan Pérez"
                  disabled={isPending || isSubmitting}
                  {...register("name")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {errors.name && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {errors.name.message}
                  </span>
                )}
              </div>

              {/* Username (Email) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ej. juan@gmail.com"
                  disabled={isPending || isSubmitting}
                  {...register("username")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {errors.username && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {errors.username.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isPending || isSubmitting}
                  {...register("password")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {errors.password && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {errors.password.message}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-brand-blue/20">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending || isSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-brand-blue/30 text-brand-sky hover:text-white hover:bg-brand-blue/20 text-xs font-bold transition-all cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky hover:from-brand-sky hover:to-brand-sky text-brand-navy font-bold text-xs shadow-md shadow-brand-sky/15 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
                >
                  {isPending || isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Guardar Administrador"
                  )}
                </button>
              </div>

            </form>
          </div>
        </>
      )}

    </div>
  );
}
