import { useReloj } from "../deck/reloj";
import { aparece, sube } from "../lib/anim";

const EQUIPO = [
  ["Aburto González Dustin", "2023630135"],
  ["Rodríguez Flor Alan Noé", "2025630489"],
  ["Sánchez Cornejo Gael Antonio", "2023630660"],
];

const N = 7;
const CELDA = 64;
const SEP = 14;
/** Renglón que trabaja en cadena: cada celda espera a la anterior. */
const CADENA = 4;

/** Rejilla de núcleos: los renglones independientes se encienden por oleadas; el renglón en cadena avanza de uno en uno. */
function Nucleos({ t }: { t: number }) {
  const paso = Math.floor(t / 0.55) % (N + 3);
  return (
    <svg width={N * (CELDA + SEP) - SEP} height={N * (CELDA + SEP) - SEP}>
      {Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) => {
          const x = c * (CELDA + SEP);
          const y = r * (CELDA + SEP);
          if (r === CADENA) {
            const fill = c < paso ? "var(--naranja-claro)" : c === paso ? "var(--naranja)" : "var(--ocioso-claro)";
            return <rect key={`${r}-${c}`} x={x} y={y} width={CELDA} height={CELDA} fill={fill} />;
          }
          // Oleada diagonal: todas las celdas trabajan, cada una en su propio momento.
          const fase = (t / 3.2 - (c + r * 0.6) / 9) % 1;
          const encendido = 0.5 + 0.5 * Math.cos(2 * Math.PI * (fase < 0 ? fase + 1 : fase));
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={CELDA} height={CELDA} fill="var(--azul-claro)" />
              <rect x={x} y={y} width={CELDA} height={CELDA} fill="var(--azul)" opacity={0.25 + 0.75 * encendido} />
            </g>
          );
        }),
      )}
    </svg>
  );
}

export default function Portada() {
  const t = useReloj();
  return (
    <div className="slide portada">
      <div className="portada-texto">
        <span className="label" style={{ opacity: aparece(t, 0.1) }}>
          Cómputo Paralelo · 6BM1 · ESCOM-IPN
        </span>
        <div className="portada-tema" style={{ opacity: aparece(t, 0.25), transform: `translateY(${sube(t, 0.25)}px)` }}>
          Tema 2.1
        </div>
        <h1 style={{ opacity: aparece(t, 0.35), transform: `translateY(${sube(t, 0.35)}px)` }}>
          Problemas paralelizables y dependencias de datos
        </h1>
        <p style={{ opacity: aparece(t, 0.6), transform: `translateY(${sube(t, 0.6)}px)` }}>
          Paralelismo en cargas de IA: preprocesamiento, entrenamiento e inferencia
        </p>
        <div className="portada-equipo" style={{ opacity: aparece(t, 0.9) }}>
          <span className="label">Equipo 7</span>
          <table>
            <tbody>
              {EQUIPO.map(([nombre, boleta]) => (
                <tr key={boleta}>
                  <td>{nombre}</td>
                  <td className="mono">{boleta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="portada-figura" style={{ opacity: aparece(t, 0.2, 0.8) }}>
        <Nucleos t={t} />
        <div className="leyenda">
          <span>
            <i style={{ background: "var(--azul)" }} /> trabaja en paralelo
          </span>
          <span>
            <i style={{ background: "var(--naranja)" }} /> espera a la anterior
          </span>
        </div>
      </div>
    </div>
  );
}

export const notas = [
  "Presentación del equipo y del tema: 2.1, problemas paralelizables y dependencias de datos, aplicado a cargas de IA.",
  "La rejilla son núcleos. Los azules trabajan todos a la vez; el renglón naranja avanza de uno en uno porque cada celda necesita la anterior.",
  "Pregunta que guía la expo: ¿por qué unas tareas se aceleran con más núcleos y otras no? La respuesta va a ser: depende de qué depende de qué.",
  "Ese código de color se mantiene en toda la exposición: azul = se reparte, naranja = dependencia o espera, gris = ocioso.",
];
