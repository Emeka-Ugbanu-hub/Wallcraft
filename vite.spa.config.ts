import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/Wallcraft/",
  plugins: [tsConfigPaths(), tailwindcss(), react()],
  build: {
    outDir: "docs",
    emptyOutDir: false,
    rollupOptions: {
      input: "index.html",
    },
  },
});
