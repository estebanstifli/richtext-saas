import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper tipico de UI: mezcla clases condicionales y resuelve conflictos Tailwind.
// Lo usamos en casi todos los componentes para no pelear con strings de className.

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
