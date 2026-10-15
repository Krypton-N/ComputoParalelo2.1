import { SlideFrame } from "../deck/SlideFrame";
import { useCiclo } from "../deck/reloj";
import { clamp01 } from "../lib/anim";

const TAREAS = 16;
const NUCLEOS = 4;
const SEG_POR_UNIDAD = 0.55;
const INICIO = 0.8;
const CICLO = INICIO + TAREAS * SEG_POR_UNIDAD + 3.2;

const ANCHO = 808;
const ETIQ = 112;
const U = (ANCHO - ETIQ - 16) / TAREAS;
const CARRIL = 66;
const SEP = 14;
const ALTO_CARRILES = NUCLEOS * (CARRIL + SEP) - SEP;

type Modo = "independientes" | "cadena";

/** En la cadena, la tarea va pasando de núcleo en zigzag (1 2 3 4 3 2 1 …): da igual a cuál le toque, siempre espera. */
const zigzag = (k: number) => {
  const p = k % (2 * NUCLEOS - 2);
  return p < NUCLEOS ? p : 2 * NUCLEOS - 2 - p;
};

/** Cuándo empieza la tarea k y en qué núcleo, según el modo. */
const plan = (modo: Modo, k: number) =>
  modo === "independientes" ? { nucleo: k % NUCLEOS, inicio: Math.floor(k / NUCLEOS) } : { nucleo: zigzag(k), inicio: k };

const fin = (modo: Modo) => (modo === "independientes" ? TAREAS / NUCLEOS : TAREAS);

/** Diagrama de Gantt: un carril por núcleo, el tiempo hacia la derecha. `u` es el tiempo actual en unidades. */
function Carriles({ modo, u }: { modo: Modo; u: number }) {
  const yC = (n: number) => n * (CARRIL + SEP);
  const x = (tiempo: number) => ETIQ + tiempo * U;
  return (
    <svg width={ANCHO} height={ALTO_CARRILES + 52}>
      {Array.from({ length: NUCLEOS }, (_, n) => (
        <g key={n}>
          <text x={0} y={yC(n) + CARRIL / 2 + 7} fontSize={20} fill="var(--tinta-2)">
            núcleo {n + 1}
          </text>
          <rect x={ETIQ} y={yC(n)} width={TAREAS * U} height={CARRIL} fill="var(--fondo-2)" />
          {/* En la cadena, los núcleos que no tienen la tarea actual esperan (naranja claro). */}
          {modo === "cadena" && (
            <rect x={ETIQ} y={yC(n)} width={Math.min(u, TAREAS) * U} height={CARRIL} fill="var(--naranja-claro)" />
          )}
        </g>
      ))}

      {Array.from({ length: TAREAS }, (_, k) => {
        const { nucleo, inicio } = plan(modo, k);
        const avance = clamp01(u - inicio);
        if (avance <= 0) return null;
        return (
          <g key={k}>
            {/* Fondo del bloque para tapar la espera en la cadena. */}
            <rect x={x(inicio)} y={yC(nucleo)} width={U} height={CARRIL} fill="var(--fondo-2)" />
            <rect x={x(inicio) + 2} y={yC(nucleo) + 2} width={avance * (U - 4)} height={CARRIL - 4} fill="var(--azul)" />
            {avance > 0.6 && (
              <text
                className="m"
                x={x(inicio) + U / 2}
                y={yC(nucleo) + CARRIL / 2 + 7}
                textAnchor="middle"
                fontSize={22}
                fill="#fff"
              >
                {k + 1}
              </text>
            )}
          </g>
        );
      })}

      {/* Flechas de la cadena: la tarea k+1 necesita el resultado de la k. */}
      {modo === "cadena" &&
        Array.from({ length: TAREAS - 1 }, (_, k) => {
          if (u < k + 1) return null;
          const a = plan(modo, k);
          const b = plan(modo, k + 1);
          return (
            <line
              key={k}
              x1={x(a.inicio + 1) - 4}
              y1={b.nucleo > a.nucleo ? yC(a.nucleo) + CARRIL - 6 : yC(a.nucleo) + 6}
              x2={x(b.inicio) + 4}
              y2={b.nucleo > a.nucleo ? yC(b.nucleo) + 6 : yC(b.nucleo) + CARRIL - 6}
              stroke="var(--naranja)"
              strokeWidth={3}
            />
          );
        })}

      {/* Eje del tiempo y cursor */}
      {[0, 4, 8, 12, 16].map((v) => (
        <text key={v} className="m" x={x(v)} y={ALTO_CARRILES + 34} textAnchor="middle" fontSize={20} fill="var(--tinta-3)">
          {v}
        </text>
      ))}
      <line
        x1={x(Math.min(u, TAREAS))}
        x2={x(Math.min(u, TAREAS))}
        y1={-4}
        y2={ALTO_CARRILES + 10}
        stroke="var(--tinta)"
        strokeWidth={2}
        opacity={u > 0 && u < TAREAS ? 0.6 : 0}
      />
    </svg>
  );
}

function Panel({ modo, u }: { modo: Modo; u: number }) {
  const hechas = modo === "independientes" ? Math.min(TAREAS, Math.floor(u) * NUCLEOS) : Math.min(TAREAS, Math.floor(u));
  const termino = u >= fin(modo);
  return (
    <div className="panel-carriles">
      <span className="label">{modo === "independientes" ? "16 tareas independientes" : "16 tareas encadenadas"}</span>
      <div className="codigo-grande">{modo === "independientes" ? "y[i] = filtro(imagen[i])" : "x[i] = f(x[i−1])"}</div>
      <Carriles modo={modo} u={u} />
      <div className="estado">
        {termino ? (
          <span className={modo === "independientes" ? "azul" : "naranja"}>
            <b>Terminó en {fin(modo)} unidades de tiempo</b>
          </span>
        ) : (
          <span className="tenue">
            Tareas hechas: <span className="mono">{hechas} / 16</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default function Repartir() {
  const t = useCiclo(CICLO);
  const u = Math.max(0, (t - INICIO) / SEG_POR_UNIDAD);
  return (
    <SlideFrame
      title="¿Cuándo se puede repartir el trabajo?"
      lede="Paralelizar es repartir trabajo independiente. Si cada paso necesita el anterior, los núcleos extra solo esperan."
    >
      <div className="dos-paneles">
        <Panel modo="independientes" u={u} />
        <Panel modo="cadena" u={u} />
      </div>
      <p className="remate">
        <span className="azul">Independiente → se reparte.</span>&nbsp;&nbsp;&nbsp;
        <span className="naranja">Encadenado → se espera.</span>
      </p>
    </SlideFrame>
  );
}

export const notas = [
  "Mismos 4 núcleos y mismas 16 tareas de una unidad de tiempo cada una. Cada carril es un núcleo y el tiempo corre hacia la derecha.",
  "Izquierda: filtrar imágenes. Cada imagen no le importa a las demás, así que los 4 núcleos toman tareas a la vez y terminan en 4 unidades.",
  "Derecha: x[i] = f(x[i−1]). La tarea 2 no puede empezar hasta tener el resultado de la 1 (flechas naranjas). Solo trabaja un núcleo; los otros esperan (naranja claro). Tarda 16, igual que con un solo núcleo.",
  "Idea: la pregunta no es cuántos núcleos tengo, sino qué depende de qué.",
];
