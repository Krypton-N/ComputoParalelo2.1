import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { RelojProvider, T_FIJO } from "./reloj";
import { Stage } from "./Stage";
import type { SlideDef } from "./types";

type Info = { num: number; total: number; seccion: string };
const DiapositivaCtx = createContext<Info>({ num: 1, total: 1, seccion: "" });
export const useDiapositiva = () => useContext(DiapositivaCtx);

// La URL guarda la diapositiva (#/5) para recargar sin perder el lugar.
function leerHash(total: number) {
  const n = Number(window.location.hash.match(/^#\/(\d+)/)?.[1] ?? 1);
  return Math.min(total - 1, Math.max(0, n - 1));
}

/** Fracción del ancho que ocupa cada orilla sensible al toque o al clic. */
const ORILLA = 0.18;

export function Deck({ slides }: { slides: SlideDef[] }) {
  const total = slides.length;
  const [index, setIndex] = useState(() => leerHash(total));
  const [pausado, setPausado] = useState(false);
  // Cambiar la llave reinicia el reloj (tecla R) sin cambiar de diapositiva.
  const [reinicio, setReinicio] = useState(0);
  const [notas, setNotas] = useState(false);
  const slide = slides[index];

  const ir = useCallback(
    (delta: number) =>
      setIndex((i) => {
        const j = Math.min(total - 1, Math.max(0, i + delta));
        if (j !== i) setPausado(false);
        return j;
      }),
    [total],
  );

  useEffect(() => {
    window.history.replaceState(null, "", `#/${index + 1}`);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          e.preventDefault();
          ir(1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          ir(-1);
          break;
        case "Home":
          setIndex(0);
          break;
        case "End":
          setIndex(total - 1);
          break;
        case "f":
        case "F":
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen();
          break;
        case "p":
        case "P":
          setPausado((p) => !p);
          break;
        case "r":
        case "R":
          setReinicio((k) => k + 1);
          setPausado(false);
          break;
        case "n":
        case "N":
          setNotas((v) => !v);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ir, total]);

  // Orillas y swipe: tocar o dar clic en el 18 % de cada lado, o deslizar el dedo.
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    inicio.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const ini = inicio.current;
    inicio.current = null;
    if (!ini || (e.target as HTMLElement).closest(".notas")) return;
    const dx = e.clientX - ini.x;
    const dy = e.clientY - ini.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
      ir(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) return;
    const x = e.clientX / window.innerWidth;
    if (x < ORILLA) ir(-1);
    else if (x > 1 - ORILLA) ir(1);
  };

  // El cursor se esconde tras 2 s sin moverse para no estorbar en la proyección.
  const [lado, setLado] = useState<"izq" | "der" | null>(null);
  useEffect(() => {
    let t = 0;
    const despierta = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        const x = e.clientX / window.innerWidth;
        setLado(x < ORILLA ? "izq" : x > 1 - ORILLA ? "der" : null);
      }
      document.body.classList.remove("idle");
      clearTimeout(t);
      t = window.setTimeout(() => document.body.classList.add("idle"), 2000);
    };
    t = window.setTimeout(() => document.body.classList.add("idle"), 2000);
    window.addEventListener("pointermove", despierta);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointermove", despierta);
    };
  }, []);

  const { Component } = slide;

  return (
    <div className="deck" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <Stage>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${slide.id}-${reinicio}`}
            style={{ position: "absolute", inset: 0 }}
            initial={T_FIJO === null ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <DiapositivaCtx.Provider value={{ num: index + 1, total, seccion: slide.seccion }}>
              <RelojProvider pausado={pausado}>
                <Component />
              </RelojProvider>
            </DiapositivaCtx.Provider>
          </motion.div>
        </AnimatePresence>

        {pausado && <div className="pausa">En pausa · P para seguir</div>}
        <div className="help">← → avanzar · F pantalla completa · N notas · P pausa · R repetir</div>
        <div className="progress">
          <div style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>

        <AnimatePresence>
          {notas && (
            <motion.aside
              className="notas"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2 }}
            >
              <span className="label">Notas · {String(index + 1).padStart(2, "0")}</span>
              <ul>
                {slide.notas.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </motion.aside>
          )}
        </AnimatePresence>
      </Stage>
      <div className={`orilla izq ${lado === "izq" ? "on" : ""}`} />
      <div className={`orilla der ${lado === "der" ? "on" : ""}`} />
    </div>
  );
}
