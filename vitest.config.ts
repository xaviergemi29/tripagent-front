import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Mismo React Compiler que la app (`reactCompiler: true` en next.config.ts). Sin él, las pruebas
  // no detectaban formularios que con el compilador enviaban valores viejos (AgencyTab, 2026-11-15).
  plugins: [react({ babel: { plugins: ["babel-plugin-react-compiler"] } })],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
