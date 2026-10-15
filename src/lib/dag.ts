// Grafo de dependencias de tareas: trabajo, span (camino crítico) y calendario con núcleos ilimitados.

export type Tarea = { id: string; nombre: string; dur: number; deps: string[] };

export type Calendario = {
  inicio: Record<string, number>;
  fin: Record<string, number>;
  /** T₁: suma de las duraciones (lo que tarda un solo núcleo). */
  trabajo: number;
  /** T∞: largo del camino más largo (lo que tarda con núcleos ilimitados). */
  span: number;
  critico: Set<string>;
};

/** Cada tarea empieza en cuanto terminan todas las que necesita (las tareas vienen en orden topológico). */
export function calendarizar(tareas: Tarea[]): Calendario {
  const inicio: Record<string, number> = {};
  const fin: Record<string, number> = {};
  for (const t of tareas) {
    inicio[t.id] = Math.max(0, ...t.deps.map((d) => fin[d]));
    fin[t.id] = inicio[t.id] + t.dur;
  }
  const trabajo = tareas.reduce((s, t) => s + t.dur, 0);
  const span = Math.max(...tareas.map((t) => fin[t.id]));

  // Camino crítico: desde la tarea que termina al último, se regresa por la dependencia que la hizo esperar.
  const critico = new Set<string>();
  const porId = Object.fromEntries(tareas.map((t) => [t.id, t]));
  let actual: Tarea | undefined = tareas.find((t) => fin[t.id] === span);
  while (actual) {
    critico.add(actual.id);
    const a: Tarea = actual;
    const d = a.deps.find((d) => fin[d] === inicio[a.id]);
    actual = d ? porId[d] : undefined;
  }
  return { inicio, fin, trabajo, span, critico };
}

/** Tareas corriendo en el instante u. */
export const ocupados = (tareas: Tarea[], cal: Calendario, u: number) =>
  tareas.filter((t) => cal.inicio[t.id] <= u && u < cal.fin[t.id]).length;
