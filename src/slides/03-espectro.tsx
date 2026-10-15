import { SlideFrame } from "../deck/SlideFrame";
import { useReloj } from "../deck/reloj";
import { aparece, suave, tramo } from "../lib/anim";

const ANCHO = 1696;
const ZONA = ANCHO / 3;
const GW = 380; // ancho de cada glifo
const GH = 120;

const ZONAS = [
  {
    nombre: "Vergonzosamente paralelo",
    sub: "las partes no se hablan",
    color: "var(--azul)",
    ejemplos: ["Aumentar las imágenes de un dataset", "Responder peticiones de distintos usuarios", "Probar combinaciones de hiperparámetros"],
  },
  {
    nombre: "Paralelo con sincronización",
    sub: "trabajan aparte y luego juntan",
    color: "var(--tinta)",
    ejemplos: ["Sumar los gradientes de un lote", "Media y desviación de todo el dataset", "Contar palabras de un corpus"],
  },
  {
    nombre: "Inherentemente secuencial",
    sub: "cada paso espera al anterior",
    color: "var(--naranja-texto)",
    ejemplos: ["Los pasos del descenso de gradiente", "Generar texto token por token", "Una RNN recorriendo una secuencia"],
  },
];

const CARRILES = [12, 44, 76, 108];

/** Cuatro carriles independientes: cada punto avanza por su cuenta. */
function Independientes({ t }: { t: number }) {
  return (
    <g>
      {CARRILES.map((y, i) => {
        const f = (t / 2.2 + i * 0.27) % 1;
        return (
          <g key={i}>
            <line x1={0} x2={GW} y1={y} y2={y} stroke="var(--azul-claro)" strokeWidth={4} />
            <circle cx={f * GW} cy={y} r={9} fill="var(--azul)" />
          </g>
        );
      })}
    </g>
  );
}

/** Cuatro carriles que convergen en un punto de encuentro: todos llegan, se juntan y sigue uno. */
function Sincronizacion({ t }: { t: number }) {
  const mx = GW * 0.68;
  const my = GH / 2;
  const f = (t % 3) / 3;
  const ida = suave(tramo(f, 0, 0.6));
  const sale = tramo(f, 0.7, 1);
  return (
    <g>
      {CARRILES.map((y, i) => (
        <g key={i}>
          <line x1={0} y1={y} x2={mx} y2={my} stroke="var(--azul-claro)" strokeWidth={4} />
          {f < 0.66 && <circle cx={ida * mx} cy={y + (my - y) * ida} r={9} fill="var(--azul)" />}
        </g>
      ))}
      <line x1={mx} y1={my} x2={GW} y2={my} stroke="var(--azul-claro)" strokeWidth={4} />
      <circle cx={mx} cy={my} r={16} fill="var(--naranja)" opacity={f > 0.55 && f < 0.75 ? 1 : 0.35} />
      {sale > 0 && <circle cx={mx + sale * (GW - mx)} cy={my} r={11} fill="var(--azul)" />}
    </g>
  );
}

/** Una cadena: solo un eslabón activo a la vez. */
function Cadena({ t }: { t: number }) {
  const n = 6;
  const paso = Math.floor(t / 0.6) % (n + 2);
  const dx = (GW - 40) / (n - 1);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          {i < n - 1 && (
            <line x1={20 + i * dx + 18} x2={20 + (i + 1) * dx - 18} y1={GH / 2} y2={GH / 2} stroke="var(--naranja)" strokeWidth={3} />
          )}
          <circle
            cx={20 + i * dx}
            cy={GH / 2}
            r={16}
            fill={i < paso ? "var(--naranja-claro)" : i === paso ? "var(--naranja)" : "var(--ocioso-claro)"}
          />
        </g>
      ))}
    </g>
  );
}

export default function Espectro() {
  const t = useReloj();
  const glifos = [Independientes, Sincronizacion, Cadena];
  return (
    <SlideFrame
      title="No es sí o no: es un espectro"
      lede="Lo que cambia es cuánto tienen que comunicarse o esperarse las partes."
    >
      <svg width={ANCHO} height={232} style={{ display: "block" }}>
        {ZONAS.map((z, i) => {
          const Glifo = glifos[i];
          return (
            <g key={z.nombre} transform={`translate(${i * ZONA}, 0)`} opacity={aparece(t, 0.2 + i * 0.25)}>
              <text x={0} y={30} fontSize={32} fontWeight={600} fill={z.color}>
                {z.nombre}
              </text>
              <text x={0} y={66} fontSize={24} fill="var(--tinta-2)">
                {z.sub}
              </text>
              <g transform="translate(0, 104)">
                <Glifo t={t} />
              </g>
            </g>
          );
        })}
      </svg>
      {/* Eje: de menos a más dependencia */}
      <div className="eje-espectro" style={{ opacity: aparece(t, 0.9) }}>
        <span className="azul">← más independencia</span>
        <span className="naranja">más dependencia →</span>
      </div>
      <div className="tres-columnas">
        {ZONAS.map((z, i) => (
          <ul key={z.nombre} className="ejemplos">
            {z.ejemplos.map((e, j) => {
              const a = 1.4 + i * 1.3 + j * 0.35;
              return (
                <li key={e} style={{ opacity: aparece(t, a), transform: `translateY(${(1 - aparece(t, a)) * -24}px)` }}>
                  {e}
                </li>
              );
            })}
          </ul>
        ))}
      </div>
      <p className="remate" style={{ opacity: aparece(t, 6) }}>
        Una misma aplicación de IA tiene partes en las tres zonas.{" "}
        <span className="tenue">Eso es lo que vamos a buscar en cada carga.</span>
      </p>
    </SlideFrame>
  );
}

export const notas = [
  "Paralelizable no es sí o no. Hay grados, según cuánto tienen que hablarse las partes.",
  "Izquierda, vergonzosamente paralelo (embarrassingly parallel): cada parte va por su carril y nunca se comunica. Ej.: aumentar imágenes, atender peticiones de distintos usuarios, probar hiperparámetros.",
  "Centro, con sincronización: cada parte trabaja sola, pero al final hay que juntar resultados (el punto naranja). Ej.: sumar los gradientes de un lote, sacar la media del dataset.",
  "Derecha, inherentemente secuencial: cada paso necesita el anterior. Ej.: los pasos del descenso de gradiente, generar texto token por token, una RNN.",
  "Cuanto más a la derecha, menos se gana con más núcleos. Una misma aplicación de IA tiene partes en las tres zonas.",
];
