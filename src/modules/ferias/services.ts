// src/modules/ferias/services.ts
import "server-only";
import { db } from "@/lib/db";
import type { ActiveFeria } from "./types/feria.types";

export async function getActiveFerias(): Promise<ActiveFeria[]> {
  const ferias = await db.feria.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      cost: true,
      dates: true,
      registrationUrl: true,
      imageBase64: true,
      isActive: true,
      encargados: {
        select: { id: true, name: true, phone: true, whatsappUrl: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return ferias.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    cost: f.cost,
    dates: f.dates,
    registrationUrl: f.registrationUrl,
    imageBase64: f.imageBase64,
    isActive: f.isActive,
    encargados: f.encargados.map((enc) => ({
      id: enc.id,
      name: enc.name,
      phone: enc.phone,
      whatsappUrl: enc.whatsappUrl,
    })),
  }));
}
