// src/components/EventCard/variants.ts

export const categoryVariants = {
  esports: {
    bg: "bg-violet-950/40 border-violet-500/30 text-violet-400",
    badge: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
    glow: "shadow-violet-950/20",
    accent: "text-violet-400",
    button: "bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white shadow-lg shadow-violet-950/40 focus-visible:ring-violet-500"
  },
  "juegos de mesa": {
    bg: "bg-amber-950/40 border-amber-500/30 text-amber-400",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    glow: "shadow-amber-950/20",
    accent: "text-amber-400",
    button: "bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-lg shadow-amber-950/40 focus-visible:ring-amber-500"
  },
  deportes: {
    bg: "bg-emerald-950/40 border-emerald-500/30 text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    glow: "shadow-emerald-950/20",
    accent: "text-emerald-400",
    button: "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-950/40 focus-visible:ring-emerald-500"
  },
  recreativos: {
    bg: "bg-fuchsia-950/40 border-fuchsia-500/30 text-fuchsia-400",
    badge: "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30",
    glow: "shadow-fuchsia-950/20",
    accent: "text-fuchsia-400",
    button: "bg-fuchsia-600 hover:bg-fuchsia-500 active:bg-fuchsia-700 text-white shadow-lg shadow-fuchsia-950/40 focus-visible:ring-fuchsia-500"
  },
  default: {
    bg: "bg-zinc-900/40 border-zinc-700 text-zinc-400",
    badge: "bg-zinc-800 text-zinc-300 border border-zinc-700",
    glow: "shadow-zinc-950/20",
    accent: "text-zinc-400",
    button: "bg-zinc-600 hover:bg-zinc-500 active:bg-zinc-700 text-white shadow-lg shadow-zinc-950/40 focus-visible:ring-zinc-500"
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
