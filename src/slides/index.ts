import type { SlideDef } from "../deck/types";
import Portada, { notas as n01 } from "./01-portada";
import Repartir, { notas as n02 } from "./02-repartir";
import Espectro, { notas as n03 } from "./03-espectro";
import Dependencias, { notas as n04 } from "./04-dependencias";
import Ciclos, { notas as n05 } from "./05-ciclos";
import Grafo, { notas as n06 } from "./06-grafo";
import TresCargas, { notas as n07 } from "./07-tres-cargas";
import Preprocesamiento, { notas as n08 } from "./08-preprocesamiento";
import DentroDelPaso, { notas as n09 } from "./09-dentro-del-paso";
import EntrePasos, { notas as n10 } from "./10-entre-pasos";
import Inferencia, { notas as n11 } from "./11-inferencia";
import Cierre, { notas as n12 } from "./12-cierre";

// Orden de la exposición (docs/PLAN.md, sección 4).
export const slides: SlideDef[] = [
  { id: "portada", seccion: "", Component: Portada, notas: n01 },
  { id: "repartir", seccion: "Fundamentos", Component: Repartir, notas: n02 },
  { id: "espectro", seccion: "Fundamentos", Component: Espectro, notas: n03 },
  { id: "dependencias", seccion: "Fundamentos", Component: Dependencias, notas: n04 },
  { id: "ciclos", seccion: "Fundamentos", Component: Ciclos, notas: n05 },
  { id: "grafo", seccion: "Fundamentos", Component: Grafo, notas: n06 },
  { id: "tres-cargas", seccion: "Cargas de IA", Component: TresCargas, notas: n07 },
  { id: "preprocesamiento", seccion: "Cargas de IA", Component: Preprocesamiento, notas: n08 },
  { id: "dentro-del-paso", seccion: "Cargas de IA", Component: DentroDelPaso, notas: n09 },
  { id: "entre-pasos", seccion: "Cargas de IA", Component: EntrePasos, notas: n10 },
  { id: "inferencia", seccion: "Cargas de IA", Component: Inferencia, notas: n11 },
  { id: "cierre", seccion: "Cierre", Component: Cierre, notas: n12 },
];
