// src/app/page.tsx
import { getActiveEvents } from "@/modules/registration/services";
import { getActiveFerias } from "@/modules/ferias/services";
import { getSystemConfig } from "@/modules/system-config/actions";
import { HomeClient } from "./_components/HomeClient";

// Set dynamic page caching behavior or ISR if desired
export const revalidate = 60; // Revalidate every minute

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
        title1: config.title1,
        title2: config.title2,
        description: config.description,
        feriaTitle2: config.feriaTitle2,
        feriaDescription: config.feriaDescription,
      }}
    />
  );
}
