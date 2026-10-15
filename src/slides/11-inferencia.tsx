import { SlideFrame } from "../deck/SlideFrame";
import { useCiclo, useReloj } from "../deck/reloj";
import { aparece, lerp, suave, tramo } from "../lib/anim";

// ---------- Izquierda: peticiones de distintos usuarios ----------

type Modo = { titulo: string; periodo: number; filas: number; cols: number };
// Esquema: un lote de 8 tarda el doble que una sola petición, pero atiende 8.
const UNA: Modo = { titulo: "Una petición a la vez", periodo: 0.5, filas: 1, cols: 1 };
const LOTE: Modo = { titulo: "En lotes de 8", periodo: 1.0, filas: 4, cols: 2 };

const BOX0 = 300;
const BOX1 = 460;
const PUNTO = 18;

function Grupo({ x, y, m, color }: { x: number; y: number; m: Modo; color: string }) {
  return (
    <g>
      {Array.from({ length: m.filas }, (_, f) =>
        Array.from({ length: m.cols }, (_, c) => (
          <circle
            key={`${f}-${c}`}
            cx={x + (c - (m.cols - 1) / 2) * PUNTO}
            cy={y + (f - (m.filas - 1) / 2) * PUNTO}
            r={6.5}
            fill={color}
          />
        )),
      )}
    </g>
  );
}

function Peticiones({ m, t, y0 }: { m: Modo; t: number; y0: number }) {
  const fase = (t % m.periodo) / m.periodo;
  const avance = suave(fase);
  const atendidas = Math.floor(t / m.periodo) * m.filas * m.cols;
  const gap = m.cols * PUNTO + 26;
  const cy = y0 + 80;
  return (
    <g>
      <text x={0} y={y0 + 22} fontSize={24} fontWeight={600} fill="var(--tinta)">
        {m.titulo}
      </text>
      <text x={780} y={y0 + 22} textAnchor="end" fontSize={22} fill="var(--tinta-2)">
        atendidas{" "}
        <tspan className="m" fontWeight={600} fill="var(--azul)">
          {atendidas}
        </tspan>
      </text>
      {/* Fila de espera: avanza un lugar en cada periodo */}
      {Array.from({ length: 6 }, (_, j) => (
        <Grupo key={j} x={230 - (j + 1) * gap + avance * gap} y={cy} m={m} color="var(--ocioso)" />
      ))}
      <rect x={BOX0} y={cy - 56} width={BOX1 - BOX0} height={112} fill="var(--azul-claro)" />
      <text x={(BOX0 + BOX1) / 2} y={cy + 86} textAnchor="middle" fontSize={20} fill="var(--tinta-3)">
        modelo
      </text>
      <Grupo x={lerp(230, 640, avance)} y={cy} m={m} color="var(--azul)" />
      <line x1={0} x2={780} y1={cy + 110} y2={cy + 110} stroke="var(--linea)" />
    </g>
  );
}

// ---------- Derecha: generar texto con un LLM ----------

const PROMPT = ["El", "cómputo", "paralelo", "sirve", "para"];
const SALIDA = ["repartir", "el", "trabajo", "entre", "núcleos", "."];
const FS = 28;
const anchoToken = (s: string) => Math.max(44, s.length * FS * 0.56 + 30);
const TH = 52;
const TGAP = 14;

function filaTokens(tokens: string[], y: number) {
  let x = 0;
  return tokens.map((s) => {
    const w = anchoToken(s);
    const r = { s, x, y, w };
    x += w + TGAP;
    return r;
  });
}

const FILA_P = filaTokens(PROMPT, 64);
const FILA_S = filaTokens(SALIDA, 276);
const PREFILL = [1.4, 2.2];
const DECODE0 = 3.0;
const DECODE_PASO = 0.9;
const CICLO = 13;

/** Arco naranja de un token al siguiente: «este necesita al anterior». */
function Arco({ a, b }: { a: (typeof FILA_P)[number]; b: (typeof FILA_P)[number] }) {
  const ax = a.x + a.w / 2;
  const bx = b.x + b.w / 2;
  if (a.y === b.y) {
    return <path d={`M ${ax} ${a.y - 4} Q ${(ax + bx) / 2} ${a.y - 40} ${bx} ${b.y - 4}`} fill="none" stroke="var(--naranja)" strokeWidth={3} />;
  }
  return <path d={`M ${ax} ${a.y + TH + 4} C ${ax} ${a.y + TH + 90}, ${bx} ${b.y - 90}, ${bx} ${b.y - 4}`} fill="none" stroke="var(--naranja)" strokeWidth={3} />;
}

function Generacion({ t }: { t: number }) {
  const pre = suave(tramo(t, PREFILL[0], PREFILL[1]));
  const generados = Math.max(0, Math.min(SALIDA.length, Math.floor((t - DECODE0) / DECODE_PASO) + 1));
  const pasos = (pre > 0 ? 1 : 0) + generados;
  const anteriores = [FILA_P[FILA_P.length - 1], ...FILA_S];
  return (
    <svg width={820} height={440} style={{ display: "block" }}>
      <text x={0} y={30} fontSize={22} fill="var(--tinta-2)">
        prompt
      </text>
      <text x={820} y={30} textAnchor="end" fontSize={22} fill="var(--tinta-2)">
        pasos{" "}
        <tspan className="m" fontWeight={600} fill="var(--tinta)">
          {pasos}
        </tspan>
      </text>
      {FILA_P.map((k, i) => (
        <g key={i} opacity={aparece(t, 0.3 + i * 0.08)}>
          <rect x={k.x} y={k.y} width={k.w} height={TH} fill={pre > 0 ? "var(--azul)" : "var(--fondo-2)"} opacity={pre > 0 ? 0.25 + 0.75 * pre : 1} />
          <text x={k.x + k.w / 2} y={k.y + TH / 2 + 10} textAnchor="middle" fontSize={FS} fill={pre > 0.5 ? "#fff" : "var(--tinta)"}>
            {k.s}
          </text>
        </g>
      ))}
      <g opacity={aparece(t, PREFILL[0])}>
        <text x={0} y={FILA_P[0].y + TH + 40} fontSize={22} fill="var(--azul)">
          prefill: todo el prompt a la vez, en 1 paso
        </text>
      </g>

      {FILA_S.map((k, i) => {
        if (i >= generados) return <rect key={i} x={k.x} y={k.y} width={k.w} height={TH} fill="none" stroke="var(--linea-2)" strokeDasharray="4 5" />;
        const actual = i === generados - 1 && t < DECODE0 + SALIDA.length * DECODE_PASO + 0.5;
        return (
          <g key={i}>
            <Arco a={anteriores[i]} b={k} />
            <rect x={k.x} y={k.y} width={k.w} height={TH} fill={actual ? "var(--naranja)" : "var(--naranja-claro)"} />
            <text x={k.x + k.w / 2} y={k.y + TH / 2 + 10} textAnchor="middle" fontSize={FS} fill={actual ? "#fff" : "var(--tinta)"}>
              {k.s}
            </text>
          </g>
        );
      })}
      <text x={0} y={FILA_S[0].y + TH + 40} fontSize={22} fill="var(--naranja-texto)" opacity={aparece(t, DECODE0)}>
        decode: un token por paso; cada uno necesita los anteriores
      </text>
    </svg>
  );
}

export default function Inferencia() {
  const t = useCiclo(CICLO);
  const t0 = useReloj();
  return (
    <SlideFrame
      title="Inferencia: muchas peticiones, pero un token a la vez"
      lede="Las peticiones de distintos usuarios son independientes y se agrupan. Dentro de una respuesta de texto, cada token depende de los anteriores."
    >
      <div className="dos-paneles inferencia">
        <div>
          <span className="label">Entre peticiones · esquema</span>
          <svg width={790} height={420} style={{ display: "block", marginTop: 16 }}>
            <Peticiones m={UNA} t={t0} y0={0} />
            <Peticiones m={LOTE} t={t0} y0={220} />
          </svg>
        </div>
        <div>
          <span className="label">Dentro de una respuesta · un LLM</span>
          <div style={{ marginTop: 16 }}>
            <Generacion t={t} />
          </div>
        </div>
      </div>
      <p className="remate">
        <span className="azul">Entre peticiones: se agrupan.</span>&nbsp;&nbsp;
        <span className="naranja">Dentro de una respuesta: cadena.</span>{" "}
        <span className="tenue">Optimizar la inferencia (precisión mixta, TensorRT): Unidad V.</span>
      </p>
    </SlideFrame>
  );
}

export const notas = [
  "Inferencia = usar el modelo ya entrenado para responder. Hay dos niveles.",
  `Izquierda (esquema): las peticiones de distintos usuarios no dependen entre sí. Atenderlas una por una desaprovecha la GPU; si se agrupan en lotes de 8, cada lote tarda un poco más (aquí ${LOTE.periodo} contra ${UNA.periodo}), pero se atienden ${(8 * UNA.periodo) / LOTE.periodo} veces más peticiones en el mismo tiempo. Es lo que hacen los servidores de modelos.`,
  "Derecha: un LLM respondiendo. El prompt ya se conoce completo, así que se procesa todo de una vez (prefill, azul).",
  "Pero la respuesta se genera token por token (decode, naranja): para escribir «trabajo» el modelo necesita haber escrito «repartir el». Es la misma dependencia RAW de antes, y por eso un LLM escribe palabra por palabra.",
];
