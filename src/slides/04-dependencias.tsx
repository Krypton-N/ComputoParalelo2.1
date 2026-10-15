import type { ReactNode } from "react";
import { TeX } from "../components/TeX";
import { SlideFrame } from "../deck/SlideFrame";
import { useCiclo, useReloj } from "../deck/reloj";
import { aparece, suave, tramo } from "../lib/anim";

const CICLO = 14;
const LINEA = 64;

// Guion de cada ciclo (segundos):
//   0–2 orden original · 2–3 se intercambian · 3–6 resultado roto
//   6–7 regresan y se renombra · 7–8 se intercambian otra vez · 8–13 resultado con el renombre · 13–14 regresan
function intercambio(t: number) {
  return suave(tramo(t, 2, 3)) - suave(tramo(t, 6, 6.8)) + suave(tramo(t, 7.2, 8.2)) - suave(tramo(t, 13, 13.8));
}

/** Variable resaltada: azul cuando ya se renombró. */
const V = ({ children, nuevo }: { children: ReactNode; nuevo?: boolean }) => (
  <span className={nuevo ? "var-nueva" : "var"}>{children}</span>
);

type Caso = {
  tipo: string;
  nombre: string;
  condicion: string;
  explica: string;
  s1: (r: boolean) => ReactNode;
  s2: (r: boolean) => ReactNode;
  antes: string;
  roto: string;
  /** Resultado con el renombre; null si renombrar no ayuda. */
  arreglado: string | null;
  sinArreglo?: string;
};

const CASOS: Caso[] = [
  {
    tipo: "RAW",
    nombre: "leer después de escribir · verdadera",
    condicion: "O_1 \\cap I_2 \\neq \\varnothing",
    explica: "la 2 lee lo que escribe la 1",
    s1: () => (
      <>
        <V>a</V> = b + 1
      </>
    ),
    s2: () => (
      <>
        c = <V>a</V> * 2
      </>
    ),
    antes: "c = 8",
    roto: "c = 0",
    arreglado: null,
    sinArreglo: "No hay nombre que cambiar: c necesita el valor que calcula la 1.",
  },
  {
    tipo: "WAR",
    nombre: "escribir después de leer · antidependencia",
    condicion: "I_1 \\cap O_2 \\neq \\varnothing",
    explica: "la 2 escribe lo que lee la 1",
    s1: () => (
      <>
        c = <V>a</V> * 2
      </>
    ),
    s2: (r) => (
      <>
        <V nuevo={r}>{r ? "a′" : "a"}</V> = 5
      </>
    ),
    antes: "c = 2",
    roto: "c = 10",
    arreglado: "c = 2",
  },
  {
    tipo: "WAW",
    nombre: "escribir después de escribir · de salida",
    condicion: "O_1 \\cap O_2 \\neq \\varnothing",
    explica: "las dos escriben la misma variable",
    s1: (r) => (
      <>
        <V nuevo={r}>{r ? "a′" : "a"}</V> = 1
      </>
    ),
    s2: () => (
      <>
        <V>a</V> = 2
      </>
    ),
    antes: "a = 2",
    roto: "a = 1",
    arreglado: "a = 2",
  },
];

function Columna({ caso, t }: { caso: Caso; t: number }) {
  const s = intercambio(t);
  const renombrado = t >= 6.4 && t < 13.8 && caso.arreglado !== null;
  const fase = t < 2.6 ? "antes" : t < 6.2 ? "roto" : t < 8 ? "transicion" : t < 13 ? "final" : "antes";
  const rota = fase === "roto" || (fase === "final" && caso.arreglado === null);

  let resultado: ReactNode;
  if (fase === "antes" || fase === "transicion") resultado = <span>Resultado: {caso.antes}</span>;
  else if (fase === "roto")
    resultado = (
      <span className="naranja">
        Invertidas: {caso.roto} · debía ser {caso.antes.split(" = ")[1]}
      </span>
    );
  else if (caso.arreglado) resultado = <span className="azul">Renombrando: {caso.arreglado}, ya da igual</span>;
  else resultado = <span className="naranja">{caso.sinArreglo}</span>;

  // Al intercambiarse, las líneas se cruzan haciendo un pequeño arco para que se vea el movimiento.
  const arco = Math.sin(Math.PI * s) * 28;
  return (
    <div className="dep-col">
      <div className="dep-tipo">{caso.tipo}</div>
      <div className="dep-nombre">{caso.nombre}</div>
      <div className={`dep-cond ${rota ? "rota" : ""}`}>
        <TeX>{caso.condicion}</TeX>
        <span className="explica">{caso.explica}</span>
      </div>
      <div className="dep-codigo">
        <div className="dep-linea" style={{ transform: `translate(${arco}px, ${s * LINEA}px)` }}>
          <span className="dep-s">1</span>
          {caso.s1(renombrado)}
        </div>
        <div className="dep-linea" style={{ transform: `translate(${-arco}px, ${(1 - s) * LINEA}px)` }}>
          <span className="dep-s">2</span>
          {caso.s2(renombrado)}
        </div>
      </div>
      <div className="dep-resultado">{resultado}</div>
    </div>
  );
}

export default function Dependencias() {
  const t = useCiclo(CICLO);
  const t0 = useReloj();
  return (
    <SlideFrame
      title="Dependencias de datos: ¿se pueden reordenar?"
      lede={
        <>
          Dos instrucciones pueden ir en cualquier orden, o al mismo tiempo, solo si se cumplen las tres{" "}
          <b>condiciones de Bernstein</b> (<i>I</i>: lo que lee, <i>O</i>: lo que escribe). Cada columna rompe una.
        </>
      }
    >
      <div className="tres-columnas dep">
        {CASOS.map((c, i) => (
          <div key={c.tipo} style={{ opacity: aparece(t0, 0.2 + i * 0.2) }}>
            <Columna caso={c} t={t} />
          </div>
        ))}
      </div>
      <p className="remate">
        Solo <span className="naranja">RAW</span> es una dependencia de verdad.{" "}
        <span className="tenue">WAR y WAW son «de nombre»: se quitan renombrando o con una copia por hilo.</span>
      </p>
    </SlideFrame>
  );
}

export const notas = [
  "Condiciones de Bernstein: dos instrucciones se pueden reordenar o correr a la vez si ninguna lee lo que la otra escribe y no escriben la misma variable. I = variables que lee, O = las que escribe.",
  "En cada columna las dos líneas se intercambian solas y el resultado cambia (naranja): eso prueba que había una dependencia.",
  "RAW (la 2 lee lo que escribió la 1) es la dependencia verdadera, o de flujo: c necesita el valor nuevo de a. No tiene arreglo, hay que esperar.",
  "WAR (antidependencia) y WAW (de salida) solo chocan porque usan el mismo nombre. Al renombrar a → a′ (azul), el intercambio ya no rompe nada.",
  "En paralelo, eso es privatizar: cada hilo trabaja con su propia copia de la variable. En OpenMP es la cláusula private.",
];
