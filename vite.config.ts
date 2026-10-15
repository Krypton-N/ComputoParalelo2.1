import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build` genera un solo dist/index.html con todo adentro (JS, CSS y fuentes),
// para abrirlo sin internet en la computadora del salón.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { assetsInlineLimit: 100_000_000 },
});
