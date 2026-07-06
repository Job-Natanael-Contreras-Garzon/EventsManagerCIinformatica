// src/app/admin/dashboard/loading.tsx
// Skeleton loader para el Dashboard — se activa automáticamente por el App Router

import { AdminHeader } from "@/components/admin/AdminHeader";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center pb-safe font-sans animate-pulse">
      <AdminHeader />
      <main className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">

        {/* Title skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-2 w-24 rounded-full bg-brand-blue/30" />
            <div className="h-6 w-40 rounded-lg bg-brand-blue/20" />
          </div>
          <div className="h-9 w-9 rounded-lg bg-brand-blue/20" />
        </div>

        {/* Summary cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-brand-dark/40 border border-brand-blue/20" />
          ))}
          <div className="col-span-2 h-24 rounded-2xl bg-brand-dark/40 border border-brand-blue/20" />
        </div>

        {/* Progress & Table skeletons grid on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Progress section skeleton */}
          <div className="p-5 rounded-2xl bg-brand-dark/35 border border-brand-blue/20 flex flex-col gap-4">
            <div className="h-4 w-48 rounded-full bg-brand-blue/20" />
            <div className="h-3 w-64 rounded-full bg-brand-blue/15" />
            <div className="space-y-4 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 border-b border-brand-blue/10 pb-3 last:border-0">
                  <div className="flex justify-between">
                    <div className="h-3 w-32 rounded-full bg-brand-blue/20" />
                    <div className="h-3 w-16 rounded-full bg-brand-blue/15" />
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-brand-navy" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent registrations table skeleton */}
          <div className="p-5 rounded-2xl bg-brand-dark/35 border border-brand-blue/20 flex flex-col gap-4">
            <div className="h-4 w-40 rounded-full bg-brand-blue/20" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 items-center py-2 border-b border-brand-blue/10">
                  <div className="h-3 w-28 rounded-full bg-brand-blue/20" />
                  <div className="h-3 w-20 rounded-full bg-brand-blue/15" />
                  <div className="h-3 w-12 rounded-full bg-brand-blue/15 ml-auto" />
                </div>
              ))}
            </div>
          </div>
          
        </div>

      </main>
    </div>
  );
}
