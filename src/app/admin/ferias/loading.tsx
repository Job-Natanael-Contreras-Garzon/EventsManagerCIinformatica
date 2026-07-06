// src/app/admin/ferias/loading.tsx
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function FeriasLoading() {
  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans animate-pulse">
      <AdminHeader />
      <main className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-2 w-20 rounded-full bg-brand-blue/30" />
            <div className="h-6 w-36 rounded-lg bg-brand-blue/20" />
          </div>
          <div className="h-10 w-full sm:w-28 rounded-xl bg-brand-blue/20" />
        </div>

        {/* Feria cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-brand-dark/40 border border-brand-blue/20 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 w-3/4 rounded-full bg-brand-blue/20" />
                  <div className="h-3 w-1/2 rounded-full bg-brand-blue/15" />
                </div>
                <div className="h-6 w-16 rounded-full bg-brand-blue/15" />
              </div>
              <div className="h-2 w-full rounded-full bg-brand-navy" />
              <div className="flex gap-2">
                <div className="h-8 w-16 rounded-lg bg-brand-blue/20" />
                <div className="h-8 w-16 rounded-lg bg-brand-blue/20" />
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
