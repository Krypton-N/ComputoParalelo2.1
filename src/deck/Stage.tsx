import { useLayoutEffect, useRef, type ReactNode } from "react";

// Lienzo fijo de 1920×1080 escalado para ocupar la ventana sin deformarse.
export function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      if (ref.current) ref.current.style.transform = `scale(${s}) translate(-50%, -50%)`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="viewport">
      <div className="stage" ref={ref}>
        {children}
      </div>
    </div>
  );
}
