import katex from "katex";
import { useMemo } from "react";

// Fórmula con KaTeX. `block` la centra en su propia línea.
export function TeX({ children, block = false }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, strict: false }),
    [children, block],
  );
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
