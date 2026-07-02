import { getActiveEvents } from "@/modules/registration/services";
import { GameCatalog } from "./_components/GameCatalog";

// Set dynamic page caching behavior or ISR if desired
export const revalidate = 60; // Revalidate every minute

export const metadata = {
  title: "Eventos | CI Informática",
  description: "Explora los eventos disponibles por el Aniversario de Ing. Informatica. Inscríbete de forma individual o con tu equipo.",
};

export default async function Home() {
  // Direct Server-side Database fetch
  const events = await getActiveEvents();

  return (
    <div className="min-h-screen bg-transparent text-brand-light-gray flex flex-col items-center selection:bg-brand-sky selection:text-brand-navy pb-safe">
      
      {/* Sticky Premium Header */}
      <header className="sticky top-0 z-40 w-full max-w-md bg-brand-dark/70 backdrop-blur-md border-b border-brand-blue/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/assets/logoInformatica.webp"
            alt="CI Ingeniería Informática"
            className="w-8 h-8 rounded-lg object-contain shadow-sm"
          />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">
              Portal de Eventos
            </h1>
            <span className="text-[10px] text-white/40 font-medium">
              CI INGENIERÍA INFORMÁTICA
            </span>
          </div>
        </div>
        
        {/* Active PWA Indicator / Notification Hub (Static representation) */}
        <div className="flex items-center gap-2">
          <a
            href="https://www.tiktok.com/@ci.ingenieriainformatica?_r=1&_t=ZS-97grDptqxOR"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-brand-blue/20 border border-brand-sky/15 rounded-full px-2 py-0.5 hover:bg-brand-blue/40 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
              En Vivo
            </span>
          </a>
        </div>
      </header>

      {/* Main App Container */}
      <main className="w-full max-w-md px-4 pt-6 pb-24 flex-1 flex flex-col gap-6">
        
        {/* Welcoming Gradient Card */}
        <section className="relative overflow-hidden rounded-2xl border border-brand-blue/20 bg-brand-dark/60 p-5">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-sky/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest">
              Semana Facultativa 2026
            </span>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              Catálogo de Eventos
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-brand-light-gray/70">
              Portal Oficial de Inscripcion para Actividades organizadas por el Centro Interno de Ingenieria Informatica.
              Encuentra todos los Eventos Disponibles, Inscribete facilmente y se parte de nuestras Actividades academicas, deportivas y culturales.
            </p>
          </div>
        </section>

        {/* Dynamic Game Catalog Shell */}
        <section className="flex-1">
          <GameCatalog initialEvents={events} />
        </section>
      </main>

      {/* Fixed Bottom Navigation (Standard App/PWA look) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto h-16 bg-brand-dark/95 backdrop-blur-md border-t border-brand-blue/20 flex items-center justify-around px-4">
        
        {/* Nav Item: Catalog */}
        <button className="flex flex-col items-center justify-center gap-1 text-brand-sky w-16 h-12 transition-all duration-150 min-h-[44px]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          <span className="text-[9px] font-bold tracking-wider uppercase">Juegos</span>
        </button>



        {/* Nav Item: Support */}
        <a
          href="https://wa.me/59174962427"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 text-brand-sky/60 hover:text-brand-sky w-16 h-12 transition-all duration-150 min-h-[44px]"
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
