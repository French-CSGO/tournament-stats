import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

const backendPort = process.env.BACKEND_PORT || process.env.PORT || 3001;
const backendUrl  = `http://localhost:${backendPort}`;
console.log(`[vite] API proxy → ${backendUrl}`);

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  server: {
    proxy: {
      "/api":   backendUrl,
      "/demos": backendUrl,
    },
  },
});
