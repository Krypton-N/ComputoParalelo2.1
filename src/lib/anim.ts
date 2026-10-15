// Ayudas para animar a partir del tiempo.

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Avance de 0 a 1 entre los instantes a y b. */
export const tramo = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/** Suavizado de entrada y salida. */
export const suave = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

/** Opacidad de algo que aparece en el instante `a` y se queda. */
export const aparece = (t: number, a: number, dur = 0.5) => suave(tramo(t, a, a + dur));

/** Desplazamiento vertical de algo que entra subiendo un poco (para usar junto con `aparece`). */
export const sube = (t: number, a: number, dist = 14, dur = 0.5) => (1 - suave(tramo(t, a, a + dur))) * dist;
