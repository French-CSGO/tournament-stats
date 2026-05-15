import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import path from "path";

const backendPort = process.env.BACKEND_PORT || process.env.PORT || 3001;
const backendUrl  = `http://localhost:${backendPort}`;
console.log(`[vite] API proxy → ${backendUrl}`);

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: [
      {
        // Exact match only — brackets-viewer package.json points to non-existent
        // dist/index.js; redirect to the actual compiled bundle.
        // Use regex to avoid matching sub-paths like brackets-viewer/dist/...
        find: /^brackets-viewer$/,
        replacement: path.resolve(
          __dirname,
          "node_modules/brackets-viewer/dist/brackets-viewer.min.js"
        ),
      },
    ],
  },
  server: {
    proxy: {
      "/api":   backendUrl,
      "/demos": backendUrl,
    },
  },
});
