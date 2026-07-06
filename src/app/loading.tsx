// src/app/loading.tsx
// Skeleton del catálogo público de eventos

export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050B1F] to-[#0a1535] text-white animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
        <div className="h-3 w-40 rounded-full bg-white/10 mx-auto" />
        <div className="h-10 w-64 rounded-xl bg-white/15 mx-auto" />
        <div className="h-3 w-80 rounded-full bg-white/10 mx-auto" />
        <div className="h-3 w-72 rounded-full bg-white/8 mx-auto" />
        <div className="h-3 w-56 rounded-full bg-white/6 mx-auto" />
      </div>

      {/* Cards skeleton */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex flex-col"
            >
              {/* Image placeholder */}
              <div className="h-44 bg-white/10" />
              {/* Content */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-white/15" />
                  <div className="h-5 w-12 rounded-full bg-white/10" />
                </div>
                <div className="h-5 w-3/4 rounded-full bg-white/15" />
                <div className="h-3 w-full rounded-full bg-white/10" />
                <div className="h-3 w-2/3 rounded-full bg-white/8" />
                <div className="h-9 w-full rounded-xl bg-white/10 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
