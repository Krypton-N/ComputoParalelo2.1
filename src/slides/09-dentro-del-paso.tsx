import { SlideFrame } from "../deck/SlideFrame";
import { useCiclo } from "../deck/reloj";
import { aparece, clamp01, lerp, suave, tramo } from "../lib/anim";

const CICLO = 13;

// Matrices: X (lote 4 × 6 entradas) · W (6 entradas × 5 salidas) = Y (4 × 5).
const FX = 4;
const K = 6;
const CY = 5;
const CEL = 44;
const PASO_CEL = 48;
const CELDAS = FX * CY;

const XX = 0;
const XW = 330;
const XY = 660;
const Y_W = 40;
const Y_X = Y_W + ((K - FX) * PASO_CEL) / 2;

// Tiempos del ciclo
const SEC_INI = 0.8;
const SEC_DUR = 0.2; // por celda, de una en una
const PAR_INI = 6.6;
const PAR_DUR = 0.8; // todas a la vez

function Matriz({ x0, y0, filas, cols, color }: { x0: number; y0: number; filas: number; cols: number; color: (f: number, c: number) => string }) {
  return (
    <g>
      {Array.from({ length: filas }, (_, f) =>
        Array.from({ length: cols }, (_, c) => (
          <rect key={`${f}-${c}`} x={x0 + c * PASO_CEL} y={y0 + f * PASO_CEL} width={CEL} height={CEL} fill={color(f, c)} />
        )),
      )}
    </g>
  );
}

function Matrices({ t }: { t: number }) {
  const secuencial = t < 6;
  const k = Math.floor((t - SEC_INI) / SEC_DUR); // celda en curso en la fase secuencial
  const par = clamp01((t - PAR_INI) / PAR_DUR);
  const fi = Math.floor(Math.min(k, CELDAS - 1) / CY);
  const ci = Math.min(k, CELDAS - 1) % CY;
  const enCurso = secuencial && k >= 0 && k < CELDAS;

  const colorY = (f: number, c: number) => {
    const idx = f * CY + c;
    if (secuencial) return k > idx ? "var(--azul)" : k === idx ? "var(--azul-2)" : "var(--fondo-2)";
    return par > 0 ? "var(--azul)" : "var(--fondo-2)";
  };
  const tinteX = (f: number) => (enCurso && f === fi) || (!secuencial && par > 0 && par < 1) ? "var(--azul-claro)" : "var(--ocioso-claro)";
  const tinteW = (c: number) => (enCurso && c === ci) || (!secuencial && par > 0 && par < 1) ? "var(--azul-claro)" : "var(--ocioso-claro)";
  const pasos = secuencial ? Math.max(0, Math.min(CELDAS, k + 1)) : par > 0 ? 1 : 0;

  return (
    <div>
      <div className="modo-mat">
        <span className={secuencial ? "naranja" : "azul"}>
          {secuencial ? "Un núcleo: una celda tras otra" : "GPU: todas las celdas a la vez"}
        </span>
        <span className="mono tenue">
          pasos: {pasos}
          {secuencial ? ` / ${CELDAS}` : ""}
        </span>
      </div>
      <svg width={900} height={Y_W + K * PASO_CEL + 4} style={{ display: "block" }}>
        <text x={XX} y={24} fontSize={22} fill="var(--tinta-2)">X: lote × entradas</text>
        <text x={XW} y={24} fontSize={22} fill="var(--tinta-2)">W: pesos</text>
        <text x={XY} y={24} fontSize={22} fill="var(--tinta-2)">Y = X · W</text>
        <Matriz x0={XX} y0={Y_X} filas={FX} cols={K} color={(f) => tinteX(f)} />
        <text x={XW - 34} y={Y_X + (FX * PASO_CEL) / 2 + 10} fontSize={36} fill="var(--tinta-3)" textAnchor="middle">·</text>
        <Matriz x0={XW} y0={Y_W} filas={K} cols={CY} color={(_, c) => tinteW(c)} />
        <text x={XY - 34} y={Y_X + (FX * PASO_CEL) / 2 + 10} fontSize={36} fill="var(--tinta-3)" textAnchor="middle">=</text>
        <Matriz x0={XY} y0={Y_X} filas={FX} cols={CY} color={colorY} />
      </svg>
      <p className="nota-mat">
        Cada celda de Y es un renglón de X por una columna de W. <b>No necesita ninguna otra celda de Y.</b>
      </p>
    </div>
  );
}

// Lote de 8 muestras: cada una hace su forward y backward en paralelo; sus gradientes se suman.
const MUESTRAS = 8;
const LANE = 30;
const LANE_SEP = 16;
const BAR0 = 130;
const BAR1 = 450;
const SX = 620;
const ALTO_LOTE = MUESTRAS * (LANE + LANE_SEP) - LANE_SEP;
const SY = ALTO_LOTE / 2 + 40;

function Lote({ t }: { t: number }) {
  const barra = suave(tramo(t, 0.8, 3.8));
  const viaje = suave(tramo(t, 4.0, 5.2));
  const suma = tramo(t, 5.1, 5.4);
  return (
    <svg width={716} height={ALTO_LOTE + 120} style={{ display: "block" }}>
      {Array.from({ length: MUESTRAS }, (_, i) => {
        const y = 40 + i * (LANE + LANE_SEP);
        const cy = y + LANE / 2;
        return (
          <g key={i}>
            <text x={0} y={cy + 7} fontSize={20} fill="var(--tinta-2)">
              muestra {i + 1}
            </text>
            <rect x={BAR0} y={y} width={BAR1 - BAR0} height={LANE} fill="var(--fondo-2)" />
            <rect x={BAR0} y={y} width={(BAR1 - BAR0) * barra} height={LANE} fill="var(--azul)" />
            <line x1={BAR1 + 14} y1={cy} x2={SX - 34} y2={SY} stroke="var(--linea-2)" strokeWidth={2} />
            {viaje > 0 && viaje < 1 && (
              <circle cx={lerp(BAR1 + 14, SX - 34, viaje)} cy={lerp(cy, SY, viaje)} r={8} fill="var(--azul)" />
            )}
          </g>
        );
      })}
      <text x={BAR0} y={22} fontSize={20} fill="var(--tinta-3)">forward + backward</text>
      <circle cx={SX} cy={SY} r={34} fill={suma > 0 ? "var(--naranja)" : "var(--naranja-claro)"} />
      <text x={SX} y={SY + 12} textAnchor="middle" fontSize={34} fill={suma > 0 ? "#fff" : "var(--naranja-texto)"}>
        Σ
      </text>
      <g opacity={aparece(t, 5.4)}>
        <text x={SX} y={SY + 72} textAnchor="middle" fontSize={22} fill="var(--tinta)">gradiente</text>
        <text x={SX} y={SY + 98} textAnchor="middle" fontSize={22} fill="var(--tinta)">del lote</text>
      </g>
    </svg>
  );
}

export default function DentroDelPaso() {
  const t = useCiclo(CICLO);
  return (
    <SlideFrame
      title="Entrenamiento (1): dentro de un paso, casi todo es paralelo"
      lede="Una capa de la red es una multiplicación de matrices, y cada muestra del lote hace su cálculo por su cuenta."
    >
      <div className="dos-paneles paso">
        <div>
          <span className="label">Una capa = multiplicar matrices</span>
          <Matrices t={t} />
        </div>
        <div>
          <span className="label">Un lote de 8 muestras</span>
          <Lote t={t} />
        </div>
      </div>
      <p className="remate">
        Por eso se entrena en GPU: miles de núcleos para miles de celdas.{" "}
        <span className="tenue">El único punto donde todos se esperan es la suma de gradientes.</span>
      </p>
    </SlideFrame>
  );
}

export const notas = [
  "Una capa densa de una red es Y = X · W: X tiene una muestra por renglón y W son los pesos.",
  "Izquierda: primero un solo núcleo calcula las celdas de Y una por una (se resaltan el renglón de X y la columna de W que usa cada celda). Luego la GPU calcula las 20 a la vez: ninguna celda necesita a otra.",
  "En una red real son millones de celdas. Por eso la GPU, con miles de núcleos simples, entrena mucho más rápido que la CPU.",
  "Derecha: cada muestra del lote hace su forward y su backward sin esperar a las demás. Al final, sus gradientes se suman (Σ, en naranja): es el único punto de sincronización dentro del paso. Es una reducción, como el árbol de la diapositiva 5.",
];
