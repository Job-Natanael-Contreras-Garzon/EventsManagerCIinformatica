// src/app/page.tsx
import { getActiveEvents } from "@/modules/registration/services";
import { getActiveFerias } from "@/modules/ferias/services";
import { getSystemConfig } from "@/modules/system-config/actions";
import { HomeClient } from "./_components/HomeClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Eventos y Ferias | CI Informática",
  description: "Explora los eventos y ferias de emprendimiento de la Semana Universitaria de Ingeniería Informática.",
};

export default async function Home() {
  // Concurrent data fetching
  const [events, ferias, config] = await Promise.all([
    getActiveEvents(),
    getActiveFerias(),
    getSystemConfig(),
  ]);

  return (
    <HomeClient
      initialEvents={events}
      initialFerias={ferias}
      systemConfig={{
        title1: config.title1 || "SEMANA FACULTATIVA 2026",
        title2: config.title2 || "Catálogo de Eventos",
        description: config.description || "Portal Oficial de Inscripcion para Actividades organizadas por el Centro Interno de Ingenieria Informatica.",
        feriaTitle2: config.feriaTitle2 || "Feria de Emprendimiento",
        feriaDescription: config.feriaDescription || "Apoya el talento local y los proyectos de nuestros estudiantes.",
      }}
    />
  );
}
