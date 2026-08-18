import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendPort = env.BACKEND_PORT || env.PORT || 3001;
  const backendUrl  = `http://localhost:${backendPort}`;
  console.log(`[vite] API proxy → ${backendUrl}`);

  return {
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
        "/api": {
          target: backendUrl,
          // Injected server-side so the browser never sees the key —
          // mirrors the X-Api-Key header added by Nginx in production.
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (env.INTERNAL_API_KEY) proxyReq.setHeader("X-Api-Key", env.INTERNAL_API_KEY);
            });
          },
        },
        "/demos": backendUrl,
      },
    },
  };
});
