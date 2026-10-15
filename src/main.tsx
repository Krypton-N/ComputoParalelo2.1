import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Solo latín y griego para que el HTML final no cargue alfabetos que no se usan.
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/greek-400.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "katex/dist/katex.min.css";
import "./theme.css";
import { Deck } from "./deck/Deck";
import { slides } from "./slides";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Deck slides={slides} />
  </StrictMode>,
);
