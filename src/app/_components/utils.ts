// src/app/_components/utils.ts
export function cn(...inputs: (string | undefined | null | false | boolean)[]) {
  return inputs.filter(Boolean).join(" ");
}
