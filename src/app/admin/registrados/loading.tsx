// src/app/admin/registrados/loading.tsx
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function RegistradosLoading() {
  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans animate-pulse">
      <AdminHeader />
      <main className="w-full max-w-lg px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="h-2 w-20 rounded-full bg-brand-blue/30" />
          <div className="h-6 w-48 rounded-lg bg-brand-blue/20" />
        </div>

        {/* Filters skeleton */}
        <div className="flex gap-2">
          <div className="h-10 flex-1 rounded-xl bg-brand-blue/20" />
          <div className="h-10 w-28 rounded-xl bg-brand-blue/20" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-2xl bg-brand-dark/40 border border-brand-blue/20 overflow-hidden">
          {/* Header row */}
          <div className="flex gap-3 px-4 py-3 border-b border-brand-blue/20">
            {[40, 32, 20].map((w, i) => (
              <div key={i} className={`h-2 rounded-full bg-brand-blue/30`} style={{ width: `${w}%` }} />
            ))}
          </div>
          {/* Data rows */}
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-brand-blue/10 last:border-0">
              <div className="h-3 rounded-full bg-brand-blue/20" style={{ width: "40%" }} />
              <div className="h-3 rounded-full bg-brand-blue/15" style={{ width: "32%" }} />
              <div className="h-3 rounded-full bg-brand-blue/10" style={{ width: "20%" }} />
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
