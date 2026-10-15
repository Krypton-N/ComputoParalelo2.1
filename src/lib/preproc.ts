// Simulación (esquema) de un DataLoader: los trabajadores de CPU preparan lotes y la GPU entrena con ellos.

export type Segmento = { carril: number; inicio: number; fin: number; lote: number; tipo: "preparar" | "entrenar" };

/**
 * `trabajadores` = 0 reproduce num_workers=0: el mismo proceso prepara y luego entrena, uno tras otro.
 * Con k ≥ 1, cada trabajador prepara lotes completos sin parar (el lote n lo hace el trabajador n mod k)
 * y la GPU entrena cada lote en cuanto está listo y ella está libre.
 * Carriles: 0 … k−1 son los trabajadores (o 0 la CPU si k = 0) y el último es la GPU.
 */
export function simular(trabajadores: number, preparar: number, entrenar: number, horizonte: number): Segmento[] {
  const segs: Segmento[] = [];
  if (trabajadores === 0) {
    let t = 0;
    for (let n = 0; t < horizonte; n++) {
      segs.push({ carril: 0, inicio: t, fin: t + preparar, lote: n + 1, tipo: "preparar" });
      t += preparar;
      segs.push({ carril: 1, inicio: t, fin: t + entrenar, lote: n + 1, tipo: "entrenar" });
      t += entrenar;
    }
    return segs;
  }
  const listo: number[] = [];
  for (let n = 0; ; n++) {
    const w = n % trabajadores;
    const ronda = Math.floor(n / trabajadores);
    const ini = ronda * preparar;
    if (ini >= horizonte) break;
    segs.push({ carril: w, inicio: ini, fin: ini + preparar, lote: n + 1, tipo: "preparar" });
    listo.push(ini + preparar);
  }
  let gpuLibre = 0;
  for (let n = 0; n < listo.length; n++) {
    const ini = Math.max(listo[n], gpuLibre);
    if (ini >= horizonte) break;
    segs.push({ carril: trabajadores, inicio: ini, fin: ini + entrenar, lote: n + 1, tipo: "entrenar" });
    gpuLibre = ini + entrenar;
  }
  return segs;
}

/** Lotes que la GPU terminó de entrenar hasta el instante u. */
export const lotesEntrenados = (segs: Segmento[], u: number) =>
  segs.filter((s) => s.tipo === "entrenar" && s.fin <= u).length;

/** Fracción del tiempo transcurrido en que la GPU estuvo ocupada. */
export function gpuOcupada(segs: Segmento[], u: number) {
  if (u <= 0) return 0;
  const ocupado = segs
    .filter((s) => s.tipo === "entrenar")
    .reduce((acc, s) => acc + Math.max(0, Math.min(u, s.fin) - s.inicio), 0);
  return ocupado / u;
}
