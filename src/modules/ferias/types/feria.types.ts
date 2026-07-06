// src/modules/ferias/types/feria.types.ts
import { EncargadoDTO } from "@/modules/registration/types/event.types";

export interface ActiveFeria {
  id: string;
  name: string;
  description: string | null;
  cost: string;
  dates: string;
  registrationUrl: string | null;
  imageBase64?: string | null;
  isActive: boolean;
  encargados: EncargadoDTO[];
}
