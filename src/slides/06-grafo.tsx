import { TeX } from "../components/TeX";
import { SlideFrame } from "../deck/SlideFrame";
import { useCiclo } from "../deck/reloj";
import { clamp01 } from "../lib/anim";
import { calendarizar, ocupados, type Tarea } from "../lib/dag";

// Una iteración de entrenamiento con un lote de 6 imágenes. Duraciones en unidades de tiempo (esquema).
const LEER = [1, 1, 2, 1, 1, 1];
const DECOD = [3, 2, 4, 2, 3, 2];
const AUMENTAR = 2;
const IMGS = LEER.length;

const TAREAS: Tarea[] = [
  ...LEER.flatMap((l, i) => [
    { id: `leer${i}`, nombre: "leer", dur: l, deps: [] },
    { id: `dec${i}`, nombre: "decodificar", dur: DECOD[i], deps: [`leer${i}`] },
    { id: `aum${i}`, nombre: "aumentar", dur: AUMENTAR, deps: [`dec${i}`] },
  ]),
  { id: "lote", nombre: "lote", dur: 1, deps: LEER.map((_, i) => `aum${i}`) },
  { id: "fwd", nombre: "forward", dur: 3, deps: ["lote"] },
  { id: "loss", nombre: "pérdida", dur: 2, deps: ["fwd"] },
  { id: "bwd", nombre: "backward", dur: 4, deps: ["loss"] },
  { id: "upd", nombre: "actualizar", dur: 2, deps: ["bwd"] },
];
const CAL = calendarizar(TAREAS);
const PARALELISMO = CAL.trabajo / CAL.span;

const SEG_POR_UNIDAD = 0.45;
const INICIO = 0.8;
const CICLO = INICIO + CAL.span * SEG_POR_UNIDAD + 3.5;

const X0 = 140;
const UNIDAD = 70;
const FILA = 52;
const ALTO = 42;
const x = (u: number) => X0 + u * UNIDAD;
const filaDe = (id: string) => {
  const m = id.match(/\d+$/);
  return m ? Number(m[0]) : (IMGS - 1) / 2;
};
const y = (id: string) => 8 + filaDe(id) * FILA;
const ALTO_SVG = 8 + IMGS * FILA + 40;

export default function Grafo() {
  const t = useCiclo(CICLO);
  const u = Math.max(0, (t - INICIO) / SEG_POR_UNIDAD);
  const lote = TAREAS.find((tk) => tk.id === "lote")!;
  const xLote = x(CAL.inicio.lote);
  const yLote = y("lote") + ALTO / 2;

  return (
    <SlideFrame
      title="El grafo de dependencias y su camino crítico"
      lede="Cada tarea espera a las que necesita. El camino más largo marca un tiempo mínimo que ningún número de núcleos puede bajar."
    >
      <svg width={1696} height={ALTO_SVG} style={{ display: "block" }}>
        {Array.from({ length: IMGS }, (_, i) => (
          <text key={i} x={0} y={8 + i * FILA + ALTO / 2 + 7} fontSize={20} fill="var(--tinta-2)">
            imagen {i + 1}
          </text>
        ))}

        {/* Aristas: el final de cada imagen hacia «lote». La parte punteada es holgura: esa imagen ya acabó y espera. */}
        {lote.deps.map((d) => {
          const fx = x(CAL.fin[d]);
          const fy = y(d) + ALTO / 2;
          const critica = CAL.critico.has(d);
          const listo = u >= CAL.fin[d];
          return (
            <g key={d} opacity={listo ? 1 : 0.35}>
              {fx < xLote - 30 && (
                <line x1={fx} y1={fy} x2={xLote - 30} y2={fy} stroke="var(--linea-2)" strokeWidth={2} strokeDasharray="5 6" />
              )}
              <line
                x1={Math.max(fx, xLote - 30)}
                y1={fy}
                x2={xLote}
                y2={yLote}
                stroke={critica ? "var(--naranja)" : "var(--azul-2)"}
                strokeWidth={2.5}
              />
            </g>
          );
        })}

        {TAREAS.map((tk) => {
          const ini = CAL.inicio[tk.id];
          const av = clamp01((u - ini) / tk.dur);
          const critica = CAL.critico.has(tk.id);
          const fuerte = critica ? "var(--naranja)" : "var(--azul)";
          const claro = critica ? "var(--naranja-claro)" : "var(--azul-claro)";
          const w = tk.dur * UNIDAD - 6;
          return (
            <g key={tk.id}>
              <rect x={x(ini) + 3} y={y(tk.id)} width={w} height={ALTO} fill="var(--fondo)" />
              <rect x={x(ini) + 3} y={y(tk.id)} width={av * w} height={ALTO} fill={claro} />
              <rect
                x={x(ini) + 3}
                y={y(tk.id)}
                width={w}
                height={ALTO}
                fill="none"
                stroke={av > 0 ? fuerte : "var(--linea-2)"}
                strokeWidth={av > 0 && av < 1 ? 3 : 1.5}
              />
              <text
                x={x(ini) + 3 + w / 2}
                y={y(tk.id) + ALTO / 2 + 7}
                textAnchor="middle"
                fontSize={20}
                fill={av > 0 ? "var(--tinta)" : "var(--tinta-3)"}
              >
                {tk.nombre}
              </text>
            </g>
          );
        })}

        {/* Eje del tiempo y cursor */}
        {Array.from({ length: CAL.span / 2 + 1 }, (_, k) => (
          <text key={k} className="m" x={x(2 * k)} y={ALTO_SVG - 8} textAnchor="middle" fontSize={20} fill="var(--tinta-3)">
            {2 * k}
          </text>
        ))}
        <line
          x1={x(Math.min(u, CAL.span))}
          x2={x(Math.min(u, CAL.span))}
          y1={0}
          y2={ALTO_SVG - 34}
          stroke="var(--tinta)"
          strokeWidth={2}
          opacity={u > 0 && u < CAL.span ? 0.55 : 0}
        />
      </svg>

      <div className="contadores">
        <div>
          <b>
            <TeX>{`T_1 = ${CAL.trabajo}`}</TeX>
          </b>
          <span>trabajo: suma de todas las tareas (con 1 núcleo)</span>
        </div>
        <div>
          <b className="naranja">
            <TeX>{String.raw`T_\infty = ${CAL.span}`}</TeX>
          </b>
          <span>camino crítico: lo mínimo, con núcleos ilimitados</span>
        </div>
        <div>
          <b>
            <TeX>{String.raw`T_1 / T_\infty \approx ${PARALELISMO.toFixed(1)}`}</TeX>
          </b>
          <span>paralelismo: núcleos que sirven en promedio</span>
        </div>
        <div>
          <b className="mono azul">{u < CAL.span ? ocupados(TAREAS, CAL, u) : 0}</b>
          <span>núcleos ocupados ahora</span>
        </div>
      </div>
      <p className="remate">
        Ni con mil núcleos baja de <span className="naranja">T∞ = {CAL.span}</span>.{" "}
        <span className="tenue">La parte secuencial pone el límite: ley de Amdahl, tema 2.5.</span>
      </p>
    </SlideFrame>
  );
}

export const notas = [
  "Si dibujamos qué tarea necesita a cuál, sale un grafo dirigido sin ciclos (DAG). Aquí, una iteración de entrenamiento con 6 imágenes. Cada bloque dura lo que mide (esquema).",
  "Las 6 imágenes se leen, decodifican y aumentan en paralelo. «lote» necesita a las 6, y de ahí en adelante es una cadena: forward → pérdida → backward → actualizar.",
  "La animación corre como si hubiera núcleos ilimitados: cada tarea empieza en cuanto terminan sus dependencias. Las líneas punteadas son holgura: esa imagen ya terminó y espera a la más lenta.",
  `Naranja = camino crítico, el camino más largo (la imagen más lenta + la cadena final). T₁ = ${CAL.trabajo} es el trabajo total; T∞ = ${CAL.span} es el camino crítico; T₁/T∞ ≈ ${PARALELISMO.toFixed(1)} son los núcleos que en promedio sirven.`,
  `Aunque haya 1000 núcleos, no baja de ${CAL.span}. Eso es lo que formaliza la ley de Amdahl (tema 2.5).`,
];
