import { SlideFrame } from "../deck/SlideFrame";
import { useReloj } from "../deck/reloj";
import { aparece, sube } from "../lib/anim";

const FILAS = [
  {
    fase: "Preprocesamiento",
    reparte: "Cada muestra",
    frena: "Disco y estadísticas globales",
    como: "Varios trabajadores que preparan el siguiente lote",
  },
  {
    fase: "Entrenamiento",
    reparte: "Las celdas de cada matriz y las muestras del lote",
    frena: "Cada paso necesita los pesos del anterior",
    como: "GPU dentro del paso; paralelismo de datos con all-reduce",
  },
  {
    fase: "Inferencia",
    reparte: "Cada petición",
    frena: "Cada token necesita los anteriores",
    como: "Lotes de peticiones; prefill de todo el prompt",
  },
];

const SIGUE = [
  ["2.2", "Tipos de paralelización"],
  ["2.3", "Patrones: reduce, scan"],
  ["2.5", "Speedup y ley de Amdahl"],
  ["4.3", "Entrenamiento distribuido"],
  ["U. V", "GPU y CUDA"],
];

export default function Cierre() {
  const t = useReloj();
  // Un punto recorre el mapa del curso, de tema en tema.
  const activo = t > 3.5 ? Math.floor((t - 3.5) / 1.4) % SIGUE.length : -1;
  return (
    <SlideFrame title="Antes de pedir más núcleos, dibuja qué depende de qué">
      <table className="sintesis">
        <thead style={{ opacity: aparece(t, 0.2) }}>
          <tr>
            <th className="label">Carga</th>
            <th className="label azul">Se reparte</th>
            <th className="label naranja">Lo frena</th>
            <th className="label">Cómo se aprovecha</th>
          </tr>
        </thead>
        <tbody>
          {FILAS.map((f, i) => {
            const a = 0.6 + i * 0.7;
            return (
              <tr key={f.fase} style={{ opacity: aparece(t, a), transform: `translateY(${sube(t, a)}px)` }}>
                <th>{f.fase}</th>
                <td className="azul">{f.reparte}</td>
                <td className="naranja">{f.frena}</td>
                <td>{f.como}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="sigue" style={{ opacity: aparece(t, 2.9) }}>
        <span className="label">Lo que sigue en el curso</span>
        <ol>
          {SIGUE.map(([num, tema], i) => (
            <li key={num} className={i === activo ? "activo" : ""}>
              <span className="mono">{num}</span>
              {tema}
            </li>
          ))}
        </ol>
      </div>

      <p className="remate" style={{ opacity: aparece(t, 3.2) }}>
        Gracias. <span className="tenue">¿Preguntas?</span>
      </p>
    </SlideFrame>
  );
}

export const notas = [
  "Resumen en una tabla: para cada carga de IA, qué se reparte (azul), qué lo frena (naranja) y cómo se aprovecha.",
  "La idea de toda la exposición: para saber si algo se paraleliza no hay que preguntar cuántos núcleos tengo, sino qué depende de qué. Lo independiente se reparte; lo encadenado pone el límite.",
  "Abajo, dónde se profundiza cada cosa en el curso: tipos de paralelización (2.2), patrones como reduce y scan (2.3), Amdahl (2.5), entrenamiento distribuido (4.3) y GPU (Unidad V).",
  "Cerrar y abrir preguntas. Posibles preguntas: ¿por qué no se paralelizan los pasos de SGD? (RAW entre pasos). ¿Por qué un LLM escribe palabra por palabra? (decode). ¿Qué es all-reduce? (suma y reparte los gradientes).",
];
