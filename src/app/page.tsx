import { getActiveEvents } from "@/modules/registration/services";
import { GameCatalog } from "./_components/GameCatalog";

// Set dynamic page caching behavior or ISR if desired
export const revalidate = 60; // Revalidate every minute

export const metadata = {
  title: "Catálogo de Juegos | CI Informática",
  description: "Explora los eventos y torneos disponibles en la Facultad de Ingeniería Informática. Inscríbete de forma individual o con tu equipo.",
};

export default async function Home() {
  // Direct Server-side Database fetch
  const events = await getActiveEvents();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center selection:bg-violet-600 selection:text-white pb-safe">
      
      {/* Sticky Premium Header */}
      <header className="sticky top-0 z-40 w-full max-w-md bg-black/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-violet-500/20">
            CI
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">
              Portal de Eventos
            </h1>
            <span className="text-[10px] text-zinc-500 font-medium">
              CI INGENIERÍA INFORMÁTICA
            </span>
          </div>
        </div>
        
        {/* Active PWA Indicator / Notification Hub (Static representation) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
              En Vivo
            </span>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="w-full max-w-md px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
        
        {/* Welcoming Gradient Card */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-gradient-to-b from-zinc-900/60 to-zinc-950/20 p-5">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
              Semana Universitaria 2026
            </span>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
              Catálogo de Torneos
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Inscríbete en tus juegos favoritos. Coordina con encargados directos a través de WhatsApp y lidera tu equipo a la gloria.
            </p>
          </div>
        </section>

        {/* Dynamic Game Catalog Shell */}
        <section className="flex-1">
          <GameCatalog initialEvents={events} />
        </section>
      </main>

      {/* Fixed Bottom Navigation (Standard App/PWA look) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto h-16 bg-black/90 backdrop-blur-md border-t border-zinc-900 flex items-center justify-around px-4">
        
        {/* Nav Item: Catalog */}
        <button className="flex flex-col items-center justify-center gap-1 text-violet-500 w-16 h-12 transition-all duration-150 min-h-[44px]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          <span className="text-[9px] font-bold tracking-wider uppercase">Juegos</span>
        </button>

        {/* Nav Item: Registration (Quick Redirect) */}
        <a
          href="/registro"
          className="flex flex-col items-center justify-center gap-1 text-zinc-550 hover:text-zinc-300 w-16 h-12 transition-all duration-150 min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[9px] font-bold tracking-wider uppercase">Registro</span>
        </a>

        {/* Nav Item: Support */}
        <a
          href="https://wa.me/573001234567"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 text-zinc-550 hover:text-zinc-300 w-16 h-12 transition-all duration-150 min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[9px] font-bold tracking-wider uppercase">Ayuda</span>
        </a>
      </nav>
    </div>
  );
}
