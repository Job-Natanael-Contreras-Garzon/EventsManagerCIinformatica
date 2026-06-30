// src/modules/registration/types/event.types.ts
// =========================================================
// DTOs para la capa de presentación del módulo de eventos.
// Nunca exponer objetos Prisma directamente al cliente.
// =========================================================

/**
 * DTO de un encargado, seguro para pasar al cliente.
 * El whatsappUrl permite abrir el chat directamente.
 */
export interface EncargadoDTO {
  id: string;
  name: string;
  phone: string;
  /** URL directa de WhatsApp: https://wa.me/{phone} */
  whatsappUrl: string;
}

/**
 * DTO de un evento activo con su categoría y encargados.
 * Se usa para popular el formulario de registro y las vistas de catálogo.
 */
export interface ActiveEvent {
  id: string;
  name: string;
  description: string | null;
  date: string; // ISO 8601 string (serializable para Server → Client boundary)
  registrationDeadline: string | null;
  maxParticipants: number | null;
  category: {
    id: string;
    name: string;
  };
  encargados: EncargadoDTO[];
  /** Número actual de inscritos */
  currentRegistrations: number;
}
