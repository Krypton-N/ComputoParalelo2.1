import { SlideFrame } from "../deck/SlideFrame";
import { useCiclo, useReloj } from "../deck/reloj";
import { aparece, clamp01 } from "../lib/anim";

const A = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3];
const B = [2, 7, 1, 8, 2, 8, 1, 8, 2, 8, 4, 5, 9, 0, 4, 5];
const N = A.length;

const C = A.map((a, i) => a + B[i]);
const S = A.reduce<number[]>((acc, a, i) => [...acc, i === 0 ? a : acc[i - 1] + a], []);
/** Niveles del árbol de reducción: cada nivel suma los pares del anterior. */
const NIVELES: number[][] = [A];
while (NIVELES[NIVELES.length - 1].length > 1) {
  const prev = NIVELES[NIVELES.length - 1];
  NIVELES.push(prev.filter((_, i) => i % 2 === 0).map((v, i) => v + prev[2 * i + 1]));
}
const PASOS_CADENA = N - 1;
const PASOS_ARBOL = NIVELES.length - 1; // log₂ 16 = 4

const PASO = 0.55;
const INICIO = 0.8;
const CICLO = INICIO + PASOS_CADENA * PASO + 3.4;

const X0 = 620;
const CW = 58;
const CS = 6;
const CH = 56;
const cx = (i: number) => X0 + i * (CW + CS);
const Y1 = 0;
const Y2 = 124;
const Y3 = 252;
const NIVEL_DY = 72;

function Celda({ x, y, w = CW, h = CH, valor, fill, texto, op = 1 }: {
  x: number; y: number; w?: number; h?: number; valor: number | string; fill: string; texto: string; op?: number;
}) {
  return (
    <g opacity={op}>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      <text className="m" x={x + w / 2} y={y + h / 2 + 7} textAnchor="middle" fontSize={24} fill={texto}>
        {valor}
      </text>
    </g>
  );
}

export default function Ciclos() {
  const t = useCiclo(CICLO);
  const t0 = useReloj();
  const paso = Math.max(0, (t - INICIO) / PASO); // pasos transcurridos (continuo)

  // Centro horizontal de cada nodo del árbol en cada nivel.
  const centros: number[][] = [A.map((_, i) => cx(i) + CW / 2)];
  for (let l = 1; l < NIVELES.length; l++) {
    const p = centros[l - 1];
    centros.push(NIVELES[l].map((_, j) => (p[2 * j] + p[2 * j + 1]) / 2));
  }

  return (
    <SlideFrame
      title="Dentro de un ciclo: ¿la iteración i necesita a la i−1?"
      lede="Si no, todas corren a la vez. Si sí, hay una cadena… aunque a veces se puede reacomodar."
    >
      <div className="ciclos">
        <div className="ciclos-codigo">
          <div className="fila-codigo" style={{ top: Y1 }}>
            <div className="codigo-grande">c[i] = a[i] + b[i]</div>
            <div className="azul">Independientes: {paso >= 1 ? "1 paso" : "…"}</div>
          </div>
          <div className="fila-codigo" style={{ top: Y2 }}>
            <div className="codigo-grande">s[i] = s[i−1] + a[i]</div>
            <div className="naranja">
              Cadena: <span className="mono">{Math.min(PASOS_CADENA, Math.floor(paso))}</span> de {PASOS_CADENA} pasos
            </div>
          </div>
          <div className="fila-codigo" style={{ top: Y3 }}>
            <div className="codigo-grande">total = a[0] + … + a[15]</div>
            <div className="azul">
              Árbol: <span className="mono">{Math.min(PASOS_ARBOL, Math.floor(paso))}</span> de {PASOS_ARBOL} pasos (log₂ 16)
            </div>
            <p className="ciclos-nota" style={{ opacity: aparece(t0, 3) }}>
              Parece cadena, pero la suma es asociativa: se agrupa de dos en dos. Son las mismas 15 sumas en 4 pasos. Es una{" "}
              <b>reducción</b> (tema 2.3).
            </p>
          </div>
        </div>

        <svg className="ciclos-svg" width={1696} height={Y3 + CH + PASOS_ARBOL * NIVEL_DY + 4}>
          {/* Fila 1: todas las celdas a la vez */}
          {C.map((v, i) => (
            <g key={i}>
              <rect x={cx(i)} y={Y1} width={CW} height={CH} fill="var(--fondo-2)" />
              <Celda x={cx(i)} y={Y1} valor={v} fill="var(--azul)" texto="#fff" op={clamp01(paso)} />
            </g>
          ))}

          {/* Fila 2: una celda por paso, cada una espera a la anterior */}
          {S.map((v, i) => {
            const hecho = paso >= i;
            const actual = Math.floor(paso) === i && i > 0 && i <= PASOS_CADENA;
            return (
              <g key={i}>
                <rect x={cx(i)} y={Y2} width={CW} height={CH} fill="var(--fondo-2)" />
                {hecho && (
                  <Celda
                    x={cx(i)}
                    y={Y2}
                    valor={v}
                    fill={actual ? "var(--naranja)" : "var(--naranja-claro)"}
                    texto={actual ? "#fff" : "var(--tinta)"}
                  />
                )}
                {i > 0 && paso >= i && (
                  <path
                    d={`M ${cx(i - 1) + CW / 2} ${Y2 - 4} Q ${cx(i) - CS / 2} ${Y2 - 26} ${cx(i) + CW / 2 - 6} ${Y2 - 4}`}
                    fill="none"
                    stroke="var(--naranja)"
                    strokeWidth={2.5}
                  />
                )}
              </g>
            );
          })}

          {/* Fila 3: árbol de reducción */}
          {A.map((v, i) => (
            <Celda key={i} x={cx(i)} y={Y3} valor={v} fill="var(--azul-claro)" texto="var(--tinta)" />
          ))}
          {NIVELES.slice(1).map((nivel, l0) => {
            const l = l0 + 1;
            const op = clamp01(paso - (l - 1));
            const y = Y3 + l * NIVEL_DY;
            const w = l === PASOS_ARBOL ? 70 : CW;
            return nivel.map((v, j) => {
              const x = centros[l][j];
              const yHijo = y - NIVEL_DY + 46;
              const hijos = [centros[l - 1][2 * j], centros[l - 1][2 * j + 1]];
              return (
                <g key={`${l}-${j}`} opacity={op}>
                  {hijos.map((hx, k) => (
                    <line
                      key={k}
                      x1={hx}
                      y1={l === 1 ? Y3 + CH : yHijo}
                      x2={x}
                      y2={y}
                      stroke="var(--azul-2)"
                      strokeWidth={2}
                    />
                  ))}
                  <Celda x={x - w / 2} y={y} w={w} h={46} valor={v} fill="var(--azul)" texto="#fff" />
                </g>
              );
            });
          })}
        </svg>
      </div>
    </SlideFrame>
  );
}

export const notas = [
  "En un ciclo for, la pregunta es si la iteración i usa algo que produjo la i−1. A eso se le llama dependencia entre iteraciones (loop-carried).",
  "Arriba, c[i] = a[i] + b[i]: ninguna iteración necesita a otra, así que las 16 se calculan en un solo paso, cada una en su núcleo.",
  "En medio, la suma acumulada s[i] = s[i−1] + a[i]: cada celda espera a la anterior (flechas naranjas). Son 15 pasos, uno tras otro.",
  "Abajo, el total parece igual de encadenado, pero como la suma es asociativa se puede agrupar de dos en dos: 8 sumas a la vez, luego 4, 2 y 1. Son las mismas 15 sumas en 4 pasos (log₂ 16) y el resultado es el mismo, 80.",
  "Esto es una reducción y se verá como patrón en el tema 2.3. Moraleja: a veces la dependencia es solo la forma en que escribimos el código.",
];
