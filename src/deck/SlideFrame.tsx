import type { ReactNode } from "react";
import { useDiapositiva } from "./Deck";

type Props = {
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
};

export function SlideFrame({ title, lede, children }: Props) {
  const { num, total, seccion } = useDiapositiva();
  return (
    <div className="slide">
      <header className="slide-head">
        <span className="section">
          <b>2.1</b>&nbsp;&nbsp;/&nbsp;&nbsp;<span className="tema">{seccion}</span>
        </span>
        <span className="num">
          <em>{String(num).padStart(2, "0")}</em> / {total}
        </span>
      </header>
      <h1 className="slide-title">{title}</h1>
      {lede && <p className="slide-lede">{lede}</p>}
      <div className="slide-body">{children}</div>
    </div>
  );
}
