"use client";

import { useState } from "react";

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = () => {
    setIsChecking(true);
    // Reload page after a short visual feedback delay
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-between p-6 selection:bg-violet-650 selection:text-white max-w-md mx-auto relative overflow-hidden pb-safe">
      {/* Decorative Blur Glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-72 h-72 bg-violet-650/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-72 h-72 bg-fuchsia-650/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Sticky-like Header */}
      <header className="w-full flex items-center justify-center pt-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-violet-500/20">
            CI
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">
              Portal de Eventos
            </h1>
            <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">
              CI INGENIERÍA INFORMÁTICA
            </span>
          </div>
        </div>
      </header>

      {/* Main Connection Alert Content */}
      <main className="flex-1 w-full flex flex-col items-center justify-center z-10 max-w-xs">
        
        {/* Offline Badge */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
            Modo Sin Conexión
          </span>
        </div>

        {/* Central Glowing Wi-Fi Off Icon */}
        <div className="relative flex flex-col items-center mb-6">
          <div className="relative w-28 h-28 rounded-full border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/40 flex items-center justify-center shadow-xl shadow-black/85">
            {/* Soft Pulsing Ambient Glow */}
            <div className="absolute inset-0 rounded-full bg-rose-500/5 animate-pulse" />
            
            {/* SVG Wifi Off */}
            <svg className="w-12 h-12 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" className="stroke-rose-500 stroke-[2]" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5" />
              <path d="M5 12.5a10.94 10.94 0 0 1 5.17-2.69" />
              <path d="M12 20h.01" className="stroke-zinc-400 stroke-[3]" />
              <path d="M9.17 14.83a4 4 0 0 1 5.66 0" />
              <path d="M21.3 5a16.84 16.84 0 0 0-15.18-1.58" />
            </svg>
          </div>
        </div>

        {/* Messaging */}
        <div className="text-center">
          <h2 className="text-xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-b from-white to-zinc-300 leading-tight">
            ¡Upps! Parece que la señal se fue
          </h2>
          <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">
            El recinto del evento está muy concurrido y la red móvil puede presentar interferencias o saturación.
          </p>
        </div>

        {/* Offline Features Info Box */}
        <div className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl p-3.5 mt-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-200 leading-none">Tus registros están a salvo</h3>
              <p className="text-[10px] leading-normal text-zinc-500 mt-1">
                Tus tickets y QR previamente generados están guardados localmente y listos para presentarse en taquilla.
              </p>
            </div>
          </div>
          
          <div className="h-[1px] bg-zinc-900/80 w-full" />
          
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-fuchsia-600/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-200 leading-none">Navegación inteligente</h3>
              <p className="text-[10px] leading-normal text-zinc-500 mt-1">
                La aplicación conservará tu progreso y restaurará la vista en tiempo real al conectarse nuevamente.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <footer className="w-full flex flex-col gap-2.5 z-10 pt-4">
        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="
            w-full min-h-[48px]
            bg-gradient-to-r from-violet-600 to-fuchsia-600
            hover:from-violet-500 hover:to-fuchsia-500
            active:scale-[0.96] active:brightness-95
            disabled:opacity-50 disabled:scale-100 disabled:brightness-100
            text-white font-semibold text-xs uppercase tracking-wider
            rounded-xl
            shadow-lg shadow-violet-950/20
            transition-all duration-150
            flex items-center justify-center gap-2
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
          "
        >
          {isChecking ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Verificando...</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span>Verificar Conexión</span>
            </>
          )}
        </button>
        <p className="text-[9px] text-center text-zinc-600 font-semibold tracking-wide uppercase">
          La app se actualizará al reestablecer la señal
        </p>
      </footer>
    </div>
  );
}
