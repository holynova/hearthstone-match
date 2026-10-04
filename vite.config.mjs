import { defineConfig } from "vite";
import {readFileSync} from 'node:fs';
import react from "@vitejs/plugin-react";

const releaseVersion='v'+JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8')).version;
export default defineConfig({
  define:{__APP_VERSION__:JSON.stringify(releaseVersion)},
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.tsx"],
    },
  },
  plugins: [react()],
});
