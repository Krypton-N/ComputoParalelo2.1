import { SlideFrame } from "../deck/SlideFrame";
import { useReloj } from "../deck/reloj";
import { aparece, lerp, suave, tramo } from "../lib/anim";

const ANCHO = 1696;
const ALTO = 220;
const CY = 110;
const CARRILES = [-54, -18, 18, 54];
const R = 74; // radio del ciclo de entrenamiento

// Tramos del recorrido (en x): preprocesamiento, ciclo de entrenamiento, inferencia.
const PRE = [20, 520] as const;
const LOOP_X = 848;
const INF = [1180, 1660] as const;

const VIAJE = 7; // segundos que tarda una partícula en cruzar todo
const PARTICULAS = 20;

/** Posición de una partícula según su avance s ∈ [0, 1) y su carril. */
function posicion(s: number, carril: number): [number, number] {
  const dy = CARRILES[carril];
  if (s < 0.3) {
    // Se abre en 4 carriles al entrar y se junta al salir.
    const x = lerp(PRE[0], PRE[1], s / 0.3);
    const abre = suave(tramo(x, PRE[0], PRE[0] + 70)) * (1 - suave(tramo(x, PRE[1] - 70, PRE[1])));
    return [x, CY + dy * abre];
  }
  if (s < 0.36) return [lerp(PRE[1], LOOP_X - R, (s - 0.3) / 0.06), CY];
  if (s < 0.7) {
    // Vuelta y media al ciclo, en el sentido del reloj, de la izquierda a la derecha.
    const phi = Math.PI + 3 * Math.PI * ((s - 0.36) / 0.34);
    return [LOOP_X + R * Math.cos(phi), CY + R * Math.sin(phi)];
  }
  if (s < 0.76) return [lerp(LOOP_X + R, INF[0], (s - 0.7) / 0.06), CY];
  const x = lerp(INF[0], INF[1], (s - 0.76) / 0.24);
  const abre = suave(tramo(x, INF[0], INF[0] + 90));
  return [x, CY + dy * abre];
}

/** Carriles como trazos fijos: rama que se abre y se cierra. */
function trazoCarril(dy: number, a: number, b: number, cierra: boolean) {
  const pasos = 40;
  const pts: string[] = [];
  for (let k = 0; k <= pasos; k++) {
    const x = lerp(a, b, k / pasos);
    const abre = suave(tramo(x, a, a + (cierra ? 70 : 90))) * (cierra ? 1 - suave(tramo(x, b - 70, b)) : 1);
    pts.push(`${x.toFixed(1)},${(CY + dy * abre).toFixed(1)}`);
  }
  return pts.join(" ");
}

const FASES = [
  {
    nombre: "Preprocesamiento",
    que: "Preparar los datos: leer, decodificar, redimensionar, aumentar, tokenizar.",
    reparte: "Cada muestra, por separado.",
    frena: "Leer del disco y las estadísticas de todo el dataset.",
  },
  {
    nombre: "Entrenamiento",
    que: "Ajustar los pesos del modelo, lote tras lote.",
    reparte: "Las operaciones de un paso y las muestras del lote.",
    frena: "Cada paso necesita los pesos del anterior.",
  },
  {
    nombre: "Inferencia",
    que: "Usar el modelo ya entrenado para responder.",
    reparte: "Cada petición de cada usuario.",
    frena: "En texto, cada token necesita el anterior.",
  },
];

export default function TresCargas() {
  const t = useReloj();
  const giro = (t * 60) % 1000;
  return (
    <SlideFrame
      title="Una aplicación de IA tiene tres cargas de trabajo"
      lede="En cada una, lo que se puede repartir y lo que lo frena están en un lugar distinto."
    >
      <svg width={ANCHO} height={ALTO} style={{ display: "block" }}>
        {CARRILES.map((dy) => (
          <g key={dy}>
            <polyline points={trazoCarril(dy, PRE[0], PRE[1], true)} fill="none" stroke="var(--azul-claro)" strokeWidth={4} />
            <polyline points={trazoCarril(dy, INF[0], INF[1], false)} fill="none" stroke="var(--azul-claro)" strokeWidth={4} />
          </g>
        ))}
        <line x1={PRE[1]} x2={LOOP_X - R} y1={CY} y2={CY} stroke="var(--azul-claro)" strokeWidth={4} />
        <line x1={LOOP_X + R} x2={INF[0]} y1={CY} y2={CY} stroke="var(--azul-claro)" strokeWidth={4} />
        {/* El ciclo de entrenamiento: cada vuelta es un paso que espera al anterior (naranja). */}
        <circle
          cx={LOOP_X}
          cy={CY}
          r={R}
          fill="none"
          stroke="var(--naranja)"
          strokeWidth={4}
          strokeDasharray="14 10"
          strokeDashoffset={-giro}
        />
        {Array.from({ length: PARTICULAS }, (_, i) => {
          const s = (t / VIAJE + i / PARTICULAS) % 1;
          const [px, py] = posicion(s, i % 4);
          return <circle key={i} cx={px} cy={py} r={9} fill="var(--azul)" />;
        })}
      </svg>

      <div className="tres-columnas cargas">
        {FASES.map((f, i) => (
          <div key={f.nombre} style={{ opacity: aparece(t, 0.4 + i * 0.6), transform: `translateY(${(1 - aparece(t, 0.4 + i * 0.6)) * 14}px)` }}>
            <h2>{f.nombre}</h2>
            <p className="que">{f.que}</p>
            <div className="fila-carga">
              <span className="label azul">Se reparte</span>
              <p>{f.reparte}</p>
            </div>
            <div className="fila-carga">
              <span className="label naranja">Lo frena</span>
              <p>{f.frena}</p>
            </div>
          </div>
        ))}
      </div>
    </SlideFrame>
  );
}

export const notas = [
  "Transición a la parte de IA. Una aplicación de IA pasa por tres cargas: preparar los datos, entrenar y usar el modelo (inferencia).",
  "Los puntos son datos. En preprocesamiento se abren en carriles porque cada muestra se prepara por separado.",
  "En entrenamiento dan vueltas: cada vuelta es un paso de entrenamiento y el anillo naranja recuerda que cada paso espera al anterior.",
  "En inferencia se vuelven a abrir: cada petición es independiente.",
  "Bajo cada fase: qué se reparte (azul) y qué lo frena (naranja). Las siguientes diapositivas entran a cada una.",
];
