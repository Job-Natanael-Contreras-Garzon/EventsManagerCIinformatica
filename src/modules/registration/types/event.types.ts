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
 * DTO de un campo dinámico del evento.
 */
export interface CustomFieldDTO {
  label: string;
  value: string;
}

/**
 * DTO de un evento del catálogo público.
 * Se usa para popular el formulario de registro y las vistas de catálogo.
 */
export interface ActiveEvent {
  id: string;
  name: string;
  description: string | null;
  /** Tipo de evento: INDIVIDUAL, TEAM, OPEN (libre/informativo) */
  type: string;
  /** Estado: AVAILABLE (disponible), IN_PROGRESS (en curso), FINISHED (finalizado) */
  status: string;
  /** Género: WOMEN, MEN, BOTH */
  gender: string;
  date: string; // ISO 8601 string (serializable para Server → Client boundary)
  registrationDeadline: string | null;
  maxParticipants: number | null;
  category: {
    id: string;
    name: string;
  };
  encargados: EncargadoDTO[];
  /** Número actual de inscritos o equipos */
  currentRegistrations: number;
  /** Controla si las inscripciones están abiertas o cerradas */
  isActive: boolean;
  /** Imagen de portada del evento en formato Base64 */
  imageBase64?: string | null;
  /** Nombre del ganador/equipo ganador (opcional) */
  winnerName?: string | null;
  /** Campos dinámicos adicionales */
  customFields: CustomFieldDTO[];
  /** Campos desactivados en la vista pública */
  disabledFields: string[];
}
