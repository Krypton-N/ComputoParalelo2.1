import { SlideFrame } from "../deck/SlideFrame";
import { useReloj } from "../deck/reloj";
import { lerp, suave, tramo } from "../lib/anim";

const ANCHO = 1696;
const NODOS = 5; // w₀ … w₄
const PASOS = NODOS - 1;
const PASO = 4.5; // segundos por paso de entrenamiento
const NX = (k: number) => 200 + k * 324;
const NY = 56;
const NR = 38;

const GPUS = 4;
const GX = (g: number) => 278 + g * 380;
const BAR_W = 230;
const BAR_Y = 300;
const SX = ANCHO / 2;
const SY = 452;
const SUB = ["₀", "₁", "₂", "₃", "₄"];

export default function EntrePasos() {
  const t = useReloj();
  const s = Math.floor(t / PASO) % PASOS; // paso en curso: w_s → w_{s+1}
  const f = t % PASO;
  const barra = suave(tramo(f, 0.3, 1.9));
  const baja = suave(tramo(f, 1.9, 2.8));
  const sube = suave(tramo(f, 2.8, 3.6));
  const flecha = suave(tramo(f, 3.6, 4.3));
  const pesos = f < 3.4 ? s : s + 1;

  return (
    <SlideFrame
      title="Entrenamiento (2): entre pasos hay una cadena"
      lede="El paso t+1 necesita los pesos que dejó el paso t. Los pasos no se pueden repartir; lo que se reparte es cada paso, entre varias GPU."
    >
      <svg width={ANCHO} height={SY + 60} style={{ display: "block" }}>
        {/* Cadena de pesos */}
        {Array.from({ length: NODOS }, (_, k) => {
          const hecho = k <= s || (k === s + 1 && flecha >= 1);
          const actual = k === s;
          return (
            <g key={k}>
              {k < NODOS - 1 && (
                <line
                  x1={NX(k) + NR + 6}
                  x2={lerp(NX(k) + NR + 6, NX(k + 1) - NR - 10, k < s ? 1 : k === s ? flecha : 0)}
                  y1={NY}
                  y2={NY}
                  stroke="var(--naranja)"
                  strokeWidth={4}
                />
              )}
              {k < NODOS - 1 && (
                <line x1={NX(k) + NR + 6} x2={NX(k + 1) - NR - 10} y1={NY} y2={NY} stroke="var(--naranja)" strokeWidth={4} opacity={0.18} />
              )}
              <circle
                cx={NX(k)}
                cy={NY}
                r={NR}
                fill={hecho ? "var(--naranja-claro)" : "var(--fondo-2)"}
                stroke={actual ? "var(--naranja)" : "transparent"}
                strokeWidth={4}
              />
              <text x={NX(k)} y={NY + 10} textAnchor="middle" fontSize={30} fill={hecho ? "var(--tinta)" : "var(--tinta-3)"}>
                w{SUB[k]}
              </text>
            </g>
          );
        })}

        {/* El paso en curso, por dentro */}
        <line x1={(NX(s) + NX(s + 1)) / 2} x2={(NX(s) + NX(s + 1)) / 2} y1={NY + 14} y2={150} stroke="var(--linea-2)" strokeWidth={2} strokeDasharray="4 6" />
        <text x={(NX(s) + NX(s + 1)) / 2} y={176} textAnchor="middle" fontSize={22} fill="var(--tinta-2)">
          el paso w{SUB[s]} → w{SUB[s + 1]} por dentro
        </text>

        {Array.from({ length: GPUS }, (_, g) => {
          const cx = GX(g);
          return (
            <g key={g}>
              <text className="m" x={cx} y={226} textAnchor="middle" fontSize={22} fontWeight={500} fill="var(--tinta)">
                GPU {g + 1}
              </text>
              <text x={cx} y={258} textAnchor="middle" fontSize={21} fill="var(--tinta-2)">
                copia de w{SUB[pesos]} · ¼ del lote
              </text>
              <rect x={cx - BAR_W / 2} y={BAR_Y - 20} width={BAR_W} height={26} fill="var(--fondo-2)" />
              <rect x={cx - BAR_W / 2} y={BAR_Y - 20} width={BAR_W * barra} height={26} fill="var(--azul)" />
              <text x={cx + BAR_W / 2 + 10} y={BAR_Y + 1} fontSize={21} fill="var(--tinta-2)" opacity={barra >= 1 ? 1 : 0.3}>
                g{SUB[g + 1]}
              </text>
              <line x1={cx} y1={BAR_Y + 14} x2={SX} y2={SY - 40} stroke="var(--linea-2)" strokeWidth={2} />
              {baja > 0 && baja < 1 && <circle cx={lerp(cx, SX, baja)} cy={lerp(BAR_Y + 14, SY - 40, baja)} r={9} fill="var(--naranja)" />}
              {sube > 0 && sube < 1 && <circle cx={lerp(SX, cx, sube)} cy={lerp(SY - 40, BAR_Y + 14, sube)} r={9} fill="var(--azul)" />}
            </g>
          );
        })}
        <circle cx={SX} cy={SY} r={36} fill={baja >= 1 && sube < 1 ? "var(--naranja)" : "var(--naranja-claro)"} />
        <text x={SX} y={SY + 12} textAnchor="middle" fontSize={34} fill={baja >= 1 && sube < 1 ? "#fff" : "var(--naranja-texto)"}>
          Σ
        </text>
        <text x={SX + 56} y={SY - 2} fontSize={22} fill="var(--tinta)">
          all-reduce:
        </text>
        <text x={SX + 56} y={SY + 26} fontSize={22} fill="var(--tinta-2)">
          suma los 4 gradientes y la reparte a todas
        </text>
      </svg>
      <p className="remate">
        Paralelismo de datos: una copia del modelo por GPU y una sincronización por paso.{" "}
        <span className="tenue">Si el modelo no cabe en una GPU, se parte el modelo: tema 4.3.</span>
      </p>
    </SlideFrame>
  );
}

export const notas = [
  "Arriba, la cadena de pesos: w₁ sale de w₀, w₂ de w₁… Es una dependencia RAW entre iteraciones (diapositiva 4): el paso 2 no puede empezar sin el resultado del paso 1. Por eso no se pueden repartir los pasos.",
  "Lo que sí se reparte es cada paso. Abajo: 4 GPU, cada una con una copia completa de los pesos y una cuarta parte del lote. Calculan su gradiente al mismo tiempo (azul).",
  "Luego se sincronizan: all-reduce suma los 4 gradientes (Σ, naranja) y les regresa el resultado a todas. Así todas aplican la misma actualización y quedan con los mismos pesos nuevos.",
  "Esto es paralelismo de datos (DistributedDataParallel en PyTorch). Si el modelo no cabe en una GPU, se parte el modelo mismo (paralelismo de tensor o de tubería): eso es el tema 4.3.",
];
