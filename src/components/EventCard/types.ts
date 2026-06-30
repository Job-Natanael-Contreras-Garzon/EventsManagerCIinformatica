// src/components/EventCard/types.ts
import { ActiveEvent } from "@/modules/registration/types/event.types";

export interface EventCardProps {
  event: ActiveEvent;
  className?: string;
  onViewDetails?: () => void;
}
