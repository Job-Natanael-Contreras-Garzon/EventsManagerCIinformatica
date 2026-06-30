// src/components/EventCard/variants.ts

export const categoryVariants = {
  esports: {
    bg: "bg-brand-navy/40 border-brand-sky/20 text-brand-sky",
    badge: "bg-brand-sky/10 text-brand-sky border border-brand-sky/20",
    glow: "shadow-brand-navy/30",
    accent: "text-brand-sky",
    button: "bg-brand-sky hover:bg-brand-sky/90 active:bg-brand-sky/85 text-brand-navy shadow-lg shadow-brand-navy/40 focus-visible:ring-brand-sky"
  },
  "juegos de mesa": {
    bg: "bg-brand-dark/40 border-brand-blue/30 text-brand-sky",
    badge: "bg-brand-blue/30 text-brand-sky border border-brand-blue/40",
    glow: "shadow-brand-dark/30",
    accent: "text-brand-sky",
    button: "bg-brand-blue hover:bg-brand-blue/90 active:bg-brand-blue/85 text-white shadow-lg shadow-brand-dark/40 focus-visible:ring-brand-blue"
  },
  deportes: {
    bg: "bg-brand-dark/50 border-brand-red/30 text-brand-light-gray",
    badge: "bg-brand-red/20 text-brand-red border border-brand-red/30",
    glow: "shadow-brand-red/10",
    accent: "text-brand-red",
    button: "bg-brand-red hover:bg-brand-red/90 active:bg-brand-red/85 text-white shadow-lg shadow-brand-navy/40 focus-visible:ring-brand-red"
  },
  recreativos: {
    bg: "bg-brand-navy/55 border-brand-blue/40 text-brand-sky",
    badge: "bg-brand-blue/20 text-brand-sky border border-brand-blue/30",
    glow: "shadow-brand-navy/20",
    accent: "text-brand-sky",
    button: "bg-brand-sky hover:bg-brand-sky/90 active:bg-brand-sky/85 text-brand-navy shadow-lg focus-visible:ring-brand-sky"
  },
  default: {
    bg: "bg-brand-dark/40 border-brand-blue/20 text-brand-sky",
    badge: "bg-brand-blue/20 text-brand-sky border border-brand-blue/30",
    glow: "shadow-brand-navy/20",
    accent: "text-brand-sky",
    button: "bg-brand-blue hover:bg-brand-blue/90 active:bg-brand-blue/85 text-white shadow-lg focus-visible:ring-brand-blue"
  }
} as const;

export type CategoryKey = keyof typeof categoryVariants;

export function getCategoryStyles(categoryName: string) {
  const norm = categoryName.toLowerCase();
  if (norm in categoryVariants) {
    return categoryVariants[norm as CategoryKey];
  }
  return categoryVariants.default;
}
