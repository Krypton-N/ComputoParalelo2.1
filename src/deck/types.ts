import type { ComponentType, ReactNode } from "react";

export type SlideDef = {
  id: string;
  /** Sección que aparece en el encabezado («Fundamentos», «Cargas de IA»…). */
  seccion: string;
  Component: ComponentType;
  /** Notas para quien expone (tecla N): con leerlas se entiende la diapositiva. */
  notas: ReactNode[];
};
