import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

// Todas las animaciones son funciones del tiempo: cada diapositiva lee `t` (segundos desde que entró)
// y dibuja a partir de él. Así pausar (P) y reiniciar (R) funcionan igual en todas, y cada ensayo se ve idéntico.
const Reloj = createContext(0);

/** Modo revisión: `?t=5` congela todas las animaciones en el segundo 5 (para capturas y para revisar un cuadro). */
export const T_FIJO = (() => {
  const v = new URLSearchParams(window.location.search).get("t");
  return v === null ? null : Number(v);
})();

export function RelojProvider({ pausado, children }: { pausado: boolean; children: ReactNode }) {
  const [t, setT] = useState(T_FIJO ?? 0);
  const acumulado = useRef(0);

  useEffect(() => {
    if (pausado || T_FIJO !== null) return;
    let previo = performance.now();
    let id = 0;
    const tick = (ahora: number) => {
      // Si la pestaña estuvo oculta, no se brinca: se avanza a lo más un cuadro largo.
      acumulado.current += Math.min(0.1, (ahora - previo) / 1000);
      previo = ahora;
      setT(acumulado.current);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [pausado]);

  return <Reloj.Provider value={t}>{children}</Reloj.Provider>;
}

/** Segundos desde que entró la diapositiva (se detiene con la pausa). */
export const useReloj = () => useContext(Reloj);

/** Tiempo dentro de un ciclo que se repite: 0 … periodo. */
export const useCiclo = (periodo: number) => useReloj() % periodo;
