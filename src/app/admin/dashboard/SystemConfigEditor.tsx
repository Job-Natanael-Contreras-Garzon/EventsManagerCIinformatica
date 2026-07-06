"use client";

import { useState, useTransition } from "react";
import { updateSystemConfig } from "@/modules/system-config/actions";

interface Props {
  initialConfig: {
    title1: string;
    title2: string;
    description: string;
  };
}

/**
 * Editor de la cabecera del catálogo público.
 * Solo visible para administradores en el dashboard.
 */
export function SystemConfigEditor({ initialConfig }: Props) {
  const [title1, setTitle1] = useState(initialConfig.title1);
  const [title2, setTitle2] = useState(initialConfig.title2);
  const [description, setDescription] = useState(initialConfig.description);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await updateSystemConfig({ title1, title2, description });
      if (result.success) {
        setFeedback({ type: "success", message: "Configuración guardada correctamente." });
      } else {
        setFeedback({ type: "error", message: result.error ?? "Error al guardar." });
      }
    });
  }

  return (
    <section className="p-5 rounded-2xl bg-brand-dark/35 border border-amber-500/30 flex flex-col gap-4">
      <div>
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
          Configuración
        </span>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5">
          Cabecera del Catálogo Público
        </h3>
        <p className="text-xs text-brand-sky/60 mt-0.5 leading-relaxed">
          Edita los textos que se muestran en la página principal del portal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-[10px] font-bold text-brand-sky/60 uppercase tracking-wider mb-1">
            Título 1 (supertítulo)
          </label>
          <input
            type="text"
            value={title1}
            onChange={(e) => setTitle1(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg bg-brand-navy border border-brand-blue/40 text-white text-sm focus:outline-none focus:border-brand-sky/60 transition-colors"
            placeholder="SEMANA FACULTATIVA 2026"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-brand-sky/60 uppercase tracking-wider mb-1">
            Título 2 (heading principal)
          </label>
          <input
            type="text"
            value={title2}
            onChange={(e) => setTitle2(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg bg-brand-navy border border-brand-blue/40 text-white text-sm focus:outline-none focus:border-brand-sky/60 transition-colors"
            placeholder="Catálogo de Eventos"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-brand-sky/60 uppercase tracking-wider mb-1">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-brand-navy border border-brand-blue/40 text-white text-sm focus:outline-none focus:border-brand-sky/60 transition-colors resize-none"
            placeholder="Portal Oficial de Inscripción..."
          />
          <span className="text-[9px] text-brand-sky/40">{description.length}/500</span>
        </div>

        {feedback && (
          <div
            className={`px-3 py-2 rounded-lg text-xs font-medium ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/80 to-amber-400/80 hover:from-amber-400/90 hover:to-amber-300/90 text-brand-navy font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : "Guardar Configuración"}
        </button>
      </form>
    </section>
  );
}
