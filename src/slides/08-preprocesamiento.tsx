import { SlideFrame } from "../deck/SlideFrame";
import { useCiclo } from "../deck/reloj";
import { clamp01 } from "../lib/anim";
import { gpuOcupada, lotesEntrenados, simular, type Segmento } from "../lib/preproc";

// Esquema: preparar un lote cuesta 4 unidades de CPU; entrenarlo, 1 unidad de GPU.
const PREPARAR = 4;
const ENTRENAR = 1;
const HORIZONTE = 16;
const UNO = simular(0, PREPARAR, ENTRENAR, HORIZONTE);
const CUATRO = simular(4, PREPARAR, ENTRENAR, HORIZONTE);

const SEG_POR_UNIDAD = 0.6;
const INICIO = 0.6;
const CICLO = INICIO + HORIZONTE * SEG_POR_UNIDAD + 3;

const ANCHO = 1696;
const ETIQ = 150;
const U = (ANCHO - ETIQ - 20) / HORIZONTE;
const CARRIL = 40;
const SEP = 8;
const x = (v: number) => ETIQ + v * U;

function Gantt({ segs, carriles, u, eje = false }: { segs: Segmento[]; carriles: string[]; u: number; eje?: boolean }) {
  const gpu = carriles.length - 1;
  const y = (c: number) => c * (CARRIL + SEP);
  const alto = carriles.length * (CARRIL + SEP) - SEP;
  const ahora = Math.min(u, HORIZONTE);
  return (
    <svg width={ANCHO} height={alto + (eje ? 34 : 4)} style={{ display: "block" }}>
      {carriles.map((nombre, c) => (
        <g key={nombre}>
          <text x={0} y={y(c) + CARRIL / 2 + 7} fontSize={20} fill={c === gpu ? "var(--tinta)" : "var(--tinta-2)"} fontWeight={c === gpu ? 600 : 400}>
            {nombre}
          </text>
          <rect x={ETIQ} y={y(c)} width={HORIZONTE * U} height={CARRIL} fill="var(--fondo-2)" />
        </g>
      ))}
      {/* La GPU esperando datos: naranja claro hasta el instante actual (los bloques de trabajo la tapan). */}
      <rect x={ETIQ} y={y(gpu)} width={ahora * U} height={CARRIL} fill="var(--naranja-claro)" />
      {segs.map((s) => {
        const av = clamp01((u - s.inicio) / (s.fin - s.inicio));
        if (av <= 0) return null;
        const fin = Math.min(s.fin, HORIZONTE);
        const w = (fin - s.inicio) * U - 3;
        const gpuSeg = s.tipo === "entrenar";
        return (
          <g key={`${s.tipo}-${s.lote}`}>
            <rect x={x(s.inicio)} y={y(s.carril)} width={w} height={CARRIL} fill="var(--fondo-2)" />
            <rect
              x={x(s.inicio)}
              y={y(s.carril)}
              width={Math.min(w, av * (s.fin - s.inicio) * U - 3)}
              height={CARRIL}
              fill={gpuSeg ? "var(--azul)" : "var(--azul-claro)"}
            />
            {av > 0.5 && (
              <text
                x={x(s.inicio) + w / 2}
                y={y(s.carril) + CARRIL / 2 + 7}
                textAnchor="middle"
                fontSize={20}
                fill={gpuSeg ? "#fff" : "var(--tinta)"}
              >
                {gpuSeg ? s.lote : `prepara lote ${s.lote}`}
              </text>
            )}
          </g>
        );
      })}
      <line x1={x(ahora)} x2={x(ahora)} y1={-4} y2={alto + 4} stroke="var(--tinta)" strokeWidth={2} opacity={u > 0 && u < HORIZONTE ? 0.55 : 0} />
      {eje &&
        [0, 4, 8, 12, 16].map((v) => (
          <text key={v} className="m" x={x(v)} y={alto + 30} textAnchor="middle" fontSize={20} fill="var(--tinta-3)">
            {v}
          </text>
        ))}
    </svg>
  );
}

function Encabezado({ titulo, codigo, segs, u }: { titulo: string; codigo: string; segs: Segmento[]; u: number }) {
  const ahora = Math.min(u, HORIZONTE);
  return (
    <div className="gantt-head">
      <div>
        <b>{titulo}</b> <code className="tenue">{codigo}</code>
      </div>
      <div className="gantt-cuentas">
        <span>
          Lotes entrenados <b className="mono azul">{lotesEntrenados(segs, ahora)}</b>
        </span>
        <span>
          GPU ocupada <b className="mono">{Math.round(100 * gpuOcupada(segs, ahora))} %</b>
        </span>
      </div>
    </div>
  );
}

export default function Preprocesamiento() {
  const t = useCiclo(CICLO);
  const u = Math.max(0, (t - INICIO) / SEG_POR_UNIDAD);
  return (
    <SlideFrame
      title="Preprocesamiento: que la GPU no se quede esperando"
      lede="Preparar cada muestra es independiente, así que se reparte entre núcleos de CPU. Si la CPU no alcanza, la GPU espera (naranja)."
    >
      <Encabezado titulo="Un solo proceso prepara y luego entrena" codigo="num_workers=0" segs={UNO} u={u} />
      <Gantt segs={UNO} carriles={["CPU", "GPU"]} u={u} />
      <div style={{ height: 30 }} />
      <Encabezado titulo="4 trabajadores preparan mientras la GPU entrena" codigo="num_workers=4" segs={CUATRO} u={u} />
      <Gantt segs={CUATRO} carriles={["trabajador 1", "trabajador 2", "trabajador 3", "trabajador 4", "GPU"]} u={u} eje />
      <p className="remate">
        Mismo modelo, misma GPU: el cuello de botella eran los datos.{" "}
        <span className="tenue">Lo que depende de todo el dataset (media y desviación para normalizar) se calcula una vez, antes.</span>
      </p>
    </SlideFrame>
  );
}

export const notas = [
  `Esquema con números redondos: preparar un lote (leer, decodificar, aumentar) cuesta ${PREPARAR} unidades de CPU y entrenarlo cuesta ${ENTRENAR} de GPU.`,
  "Arriba, num_workers=0 de PyTorch: el mismo proceso prepara un lote y luego entrena. Mientras la CPU prepara, la GPU no tiene nada que hacer (naranja claro).",
  "Abajo, num_workers=4: cuatro procesos preparan lotes al mismo tiempo y los dejan listos (prefetch). Pasado el arranque, siempre hay un lote esperando y la GPU ya no se detiene.",
  `En las mismas ${HORIZONTE} unidades de tiempo: ${lotesEntrenados(UNO, HORIZONTE)} lotes contra ${lotesEntrenados(CUATRO, HORIZONTE)}. Se puede porque cada muestra se prepara sin depender de las demás.`,
  "Lo que sí depende de todos los datos, como la media para normalizar, es una reducción: se calcula una vez antes de entrenar y se guarda.",
];
