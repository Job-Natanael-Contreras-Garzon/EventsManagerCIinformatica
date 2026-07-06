// src/app/admin/usuarios/loading.tsx
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function UsuariosLoading() {
  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans animate-pulse">
      <AdminHeader />
      <main className="w-full max-w-lg px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="h-2 w-16 rounded-full bg-brand-blue/30" />
          <div className="h-6 w-40 rounded-lg bg-brand-blue/20" />
        </div>

        {/* User list skeleton */}
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-brand-dark/40 border border-brand-blue/20 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-brand-blue/20 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-3 w-32 rounded-full bg-brand-blue/20" />
                <div className="h-2.5 w-48 rounded-full bg-brand-blue/15" />
              </div>
              <div className="h-6 w-16 rounded-full bg-brand-blue/15" />
            </div>
          ))}
        </div>

        {/* Form skeleton */}
        <div className="p-5 rounded-2xl bg-brand-dark/35 border border-brand-blue/20 flex flex-col gap-3">
          <div className="h-4 w-40 rounded-full bg-brand-blue/20" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-full rounded-xl bg-brand-blue/15" />
          ))}
          <div className="h-11 w-full rounded-xl bg-brand-blue/20" />
        </div>

      </main>
    </div>
  );
}
