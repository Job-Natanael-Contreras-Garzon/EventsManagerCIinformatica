"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  updateProfileSchema,
  adminUpdateUserSchema,
  type CreateUserInput,
  type UpdateProfileInput,
  type AdminUpdateUserInput,
} from "@/modules/auth/schemas/auth.schema";
import {
  createUserAction,
  deleteUserAction,
  updateOwnProfileAction,
  updateUserByAdminAction,
} from "@/modules/auth/actions/auth.actions";
import { AdminHeader } from "@/components/admin/AdminHeader";

type UserItem = {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "COORDINATOR";
  phone: string;
};

interface UsersManagerProps {
  initialUsers: UserItem[];
  currentUserRole: "ADMIN" | "COORDINATOR";
  currentUserId: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Admin", color: "text-amber-400 border-amber-500/25 bg-amber-500/10" },
  COORDINATOR: { label: "Coordinador", color: "text-brand-sky border-brand-sky/25 bg-brand-sky/10" },
};

export function UsersManager({ initialUsers, currentUserRole, currentUserId }: UsersManagerProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── Form: Crear usuario (solo admin) ──────────────────────────────────────
  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "COORDINATOR" },
  });

  // ── Form: Editar propio perfil (coordinador básico) ────────────────────────
  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialUsers.find((u) => u.id === currentUserId)?.name ?? "",
      phone: initialUsers.find((u) => u.id === currentUserId)?.phone ?? "",
    },
  });

  // ── Form: Editar cualquier usuario por el administrador ────────────────────
  const editUserForm = useForm<AdminUpdateUserInput>({
    resolver: zodResolver(adminUpdateUserSchema),
    defaultValues: {
      id: "",
      name: "",
      username: "",
      password: "",
      role: "COORDINATOR",
      phone: "",
    },
  });

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${userName}"?`)) {
      startTransition(async () => {
        const result = await deleteUserAction(userId);
        if (!result.success) {
          alert(result.error);
          return;
        }
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      });
    }
  };

  const onSubmitCreate = (data: CreateUserInput) => {
    setGeneralError(null);
    startTransition(async () => {
      const result = await createUserAction(data);

      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            createForm.setError(field as keyof CreateUserInput, {
              message: messages?.[0],
            });
          });
        } else {
          setGeneralError(result.error ?? "Error desconocido.");
        }
        return;
      }

      // Recargar la lista desde el servidor o recargar página para reflejar IDs de verdad
      window.location.reload();
    });
  };

  const onSubmitProfile = (data: UpdateProfileInput) => {
    setProfileFeedback(null);
    startTransition(async () => {
      const result = await updateOwnProfileAction(data);
      if (result.success) {
        setProfileFeedback({ type: "success", message: "Perfil actualizado correctamente." });
        setUsers((prev) =>
          prev.map((u) =>
            u.id === currentUserId ? { ...u, name: data.name, phone: data.phone } : u
          )
        );
      } else {
        setProfileFeedback({ type: "error", message: result.error ?? "Error al actualizar." });
      }
    });
  };

  const handleEditUser = (user: UserItem) => {
    setEditingUser(user);
    setEditUserError(null);
    editUserForm.reset({
      id: user.id,
      name: user.name,
      username: user.username,
      password: "", // Contraseña vacía por defecto (no cambiar)
      role: user.role,
      phone: user.phone,
    });
    setIsEditUserOpen(true);
  };

  const onSubmitEditUser = (data: AdminUpdateUserInput) => {
    setEditUserError(null);
    startTransition(async () => {
      const result = await updateUserByAdminAction(data);
      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            editUserForm.setError(field as keyof AdminUpdateUserInput, {
              message: messages?.[0],
            });
          });
        } else {
          setEditUserError(result.error ?? "Error al actualizar el usuario.");
        }
        return;
      }

      // Actualizar UI local
      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.id
            ? { ...u, name: data.name, username: data.username, role: data.role, phone: data.phone }
            : u
        )
      );
      setIsEditUserOpen(false);
      setEditingUser(null);
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans selection:bg-brand-sky selection:text-brand-navy relative">
      
      {/* Shared Admin Header with hamburger menu for mobile */}
      <AdminHeader />

      {/* Main Admin Content Container */}
      <main className="w-full max-w-lg px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
        
        {/* Title Area */}
        <section className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest">
              {currentUserRole === "ADMIN" ? "Seguridad del Sistema" : "Mi Cuenta"}
            </span>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {currentUserRole === "ADMIN" ? "Usuarios del Sistema" : "Mi Perfil"}
            </h2>
          </div>
          
          {/* Solo admin puede crear usuarios */}
          {currentUserRole === "ADMIN" && (
            <button
              onClick={() => {
                createForm.reset({ role: "COORDINATOR" });
                setGeneralError(null);
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky hover:from-brand-sky hover:to-brand-sky text-brand-navy font-bold text-xs shadow-md shadow-brand-sky/10 active:scale-95 hover:shadow-brand-sky/20 transition-all cursor-pointer min-h-[36px]"
            >
              <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Nuevo</span>
            </button>
          )}

          {/* Coordinador ve botón de editar su propio perfil */}
          {currentUserRole === "COORDINATOR" && (
            <button
              onClick={() => {
                const me = users.find((u) => u.id === currentUserId);
                if (me) {
                  profileForm.reset({ name: me.name, phone: me.phone });
                }
                setProfileFeedback(null);
                setIsEditProfileOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky hover:from-brand-sky hover:to-brand-sky text-brand-navy font-bold text-xs shadow-md shadow-brand-sky/10 active:scale-95 hover:shadow-brand-sky/20 transition-all cursor-pointer min-h-[36px]"
            >
              <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Editar Perfil</span>
            </button>
          )}
        </section>

        {/* User list */}
        <section className="flex flex-col gap-3">
          {/* Coordinadores solo ven su propio perfil */}
          {(currentUserRole === "ADMIN" ? users : users.filter((u) => u.id === currentUserId)).map((user) => {
            const initials = user.name
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            const roleStyle = ROLE_LABELS[user.role] ?? ROLE_LABELS.ADMIN;
            const isMe = user.id === currentUserId;

            return (
              <article
                key={user.id}
                className={`p-4 rounded-2xl bg-brand-dark/45 border transition-all duration-300 flex items-center justify-between overflow-hidden relative group
                  ${isMe ? "border-brand-sky/40 hover:border-brand-sky/60" : "border-brand-blue/30 hover:border-brand-blue/50"}`}
              >
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-brand-sky/5 rounded-full blur-xl" />
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xs select-none
                    ${isMe ? "bg-brand-sky/15 border-brand-sky/35 text-brand-sky" : "bg-brand-navy border-brand-blue/45 text-brand-sky"}`}>
                    {initials || "US"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5 truncate">
                      {user.name}
                      {isMe && (
                        <span className="text-[9px] font-semibold text-brand-sky/60 border border-brand-sky/20 px-1.5 py-0.5 rounded-full">
                          Yo
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-brand-sky/70 mt-0.5 truncate">{user.username}</p>
                    {user.phone && (
                      <p className="text-[10px] text-brand-sky/40 mt-0.5">📱 {user.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold border px-2 py-1 rounded-md ${roleStyle.color}`}>
                    {roleStyle.label}
                  </span>
                  
                  {/* Administrador puede editar cualquier usuario */}
                  {currentUserRole === "ADMIN" && (
                    <button
                      onClick={() => handleEditUser(user)}
                      disabled={isPending}
                      className="w-8 h-8 rounded-lg bg-brand-sky/10 border border-brand-sky/25 flex items-center justify-center text-brand-sky hover:text-white hover:bg-brand-sky/80 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:scale-100"
                      title="Editar Usuario"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}

                  {/* Solo admin puede eliminar, y no a sí mismo */}
                  {currentUserRole === "ADMIN" && !isMe && (
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={isPending}
                      className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500/80 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:scale-100"
                      title="Eliminar Usuario"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>

      {/* ── Modal: Crear nuevo usuario (Admin only) ── */}
      {isCreateOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsCreateOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 max-w-lg mx-auto bg-brand-dark border-t border-brand-blue/25 rounded-t-3xl z-50 px-6 pt-4 pb-10 shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="w-12 h-1 bg-brand-blue/30 rounded-full mx-auto mb-5 shrink-0" />

            <div className="mb-6 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">
                  Crear Nuevo Usuario
                </h3>
                <p className="text-xs text-brand-sky/60">
                  Registra una cuenta de administrador o coordinador.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4 flex-1" noValidate>
              {generalError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-450 text-xs font-medium">
                  {generalError}
                </div>
              )}

              {/* Role selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Rol
                </label>
                <select
                  {...createForm.register("role")}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                >
                  <option value="COORDINATOR">Coordinador</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="ej. Juan Pérez"
                  disabled={isPending}
                  {...createForm.register("name")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {createForm.formState.errors.name && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {createForm.formState.errors.name.message}
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
                  disabled={isPending}
                  {...createForm.register("username")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {createForm.formState.errors.username && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {createForm.formState.errors.username.message}
                  </span>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Celular
                </label>
                <input
                  type="tel"
                  placeholder="ej. 70000000"
                  disabled={isPending}
                  {...createForm.register("phone")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {createForm.formState.errors.phone && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {createForm.formState.errors.phone.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Contraseña Genérica
                </label>
                <input
                  type="text"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isPending}
                  {...createForm.register("password")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {createForm.formState.errors.password && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {createForm.formState.errors.password.message}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-brand-blue/20">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl border border-brand-blue/30 text-brand-sky hover:text-white hover:bg-brand-blue/20 text-xs font-bold transition-all cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky hover:from-brand-sky hover:to-brand-sky text-brand-navy font-bold text-xs shadow-md shadow-brand-sky/15 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
                >
                  {isPending ? (
                    <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Guardar Usuario"
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Modal: Editar usuario por el Administrador ── */}
      {isEditUserOpen && editingUser && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => { setIsEditUserOpen(false); setEditingUser(null); }}
          />
          <div className="fixed inset-x-0 bottom-0 max-w-lg mx-auto bg-brand-dark border-t border-brand-blue/25 rounded-t-3xl z-50 px-6 pt-4 pb-10 shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="w-12 h-1 bg-brand-blue/30 rounded-full mx-auto mb-5 shrink-0" />

            <div className="mb-6 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">
                  Editar Usuario del Sistema
                </h3>
                <p className="text-xs text-brand-sky/60">
                  Modifica los datos y credenciales del usuario.
                </p>
              </div>
              <button
                onClick={() => { setIsEditUserOpen(false); setEditingUser(null); }}
                className="w-8 h-8 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={editUserForm.handleSubmit(onSubmitEditUser)} className="space-y-4 flex-1" noValidate>
              <input type="hidden" {...editUserForm.register("id")} />
              
              {editUserError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-450 text-xs font-medium">
                  {editUserError}
                </div>
              )}

              {/* Role selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Rol
                </label>
                <select
                  {...editUserForm.register("role")}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                >
                  <option value="COORDINATOR">Coordinador</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  disabled={isPending}
                  {...editUserForm.register("name")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {editUserForm.formState.errors.name && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {editUserForm.formState.errors.name.message}
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
                  disabled={isPending}
                  {...editUserForm.register("username")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {editUserForm.formState.errors.username && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {editUserForm.formState.errors.username.message}
                  </span>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Celular
                </label>
                <input
                  type="tel"
                  disabled={isPending}
                  {...editUserForm.register("phone")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {editUserForm.formState.errors.phone && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {editUserForm.formState.errors.phone.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Nueva Contraseña (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Dejar vacío para no cambiarla"
                  disabled={isPending}
                  {...editUserForm.register("password")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {editUserForm.formState.errors.password && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {editUserForm.formState.errors.password.message}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-brand-blue/20">
                <button
                  type="button"
                  onClick={() => { setIsEditUserOpen(false); setEditingUser(null); }}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl border border-brand-blue/30 text-brand-sky hover:text-white hover:bg-brand-blue/20 text-xs font-bold transition-all cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky hover:from-brand-sky hover:to-brand-sky text-brand-navy font-bold text-xs shadow-md shadow-brand-sky/15 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
                >
                  {isPending ? (
                    <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Modal: Editar propio perfil (Coordinador) ── */}
      {isEditProfileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsEditProfileOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 max-w-lg mx-auto bg-brand-dark border-t border-brand-blue/25 rounded-t-3xl z-50 px-6 pt-4 pb-10 shadow-2xl max-h-[80vh] overflow-y-auto flex flex-col">
            <div className="w-12 h-1 bg-brand-blue/30 rounded-full mx-auto mb-5 shrink-0" />
            <div className="mb-6 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">Editar Mi Perfil</h3>
                <p className="text-xs text-brand-sky/60">Actualiza tu nombre y número de celular.</p>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-brand-dark/60 border border-brand-blue/30 flex items-center justify-center text-brand-sky hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4 flex-1" noValidate>
              {profileFeedback && (
                <div className={`p-3 rounded-xl text-xs font-medium border ${
                  profileFeedback.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}>
                  {profileFeedback.message}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  disabled={isPending}
                  {...profileForm.register("name")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {profileForm.formState.errors.name && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {profileForm.formState.errors.name.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                  Celular
                </label>
                <input
                  type="tel"
                  placeholder="ej. 70000000"
                  disabled={isPending}
                  {...profileForm.register("phone")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
                />
                {profileForm.formState.errors.phone && (
                  <span className="text-[10px] text-rose-400 font-medium" role="alert">
                    {profileForm.formState.errors.phone.message}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-brand-blue/20">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl border border-brand-blue/30 text-brand-sky hover:text-white hover:bg-brand-blue/20 text-xs font-bold transition-all cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky text-brand-navy font-bold text-xs active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
                >
                  {isPending ? (
                    <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Guardar Cambios"
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
