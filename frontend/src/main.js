import { createApp } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import router from "./router/index.js";
import App from "./App.vue";

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "dark",
    themes: {
      dark: {
        colors: {
          primary: "#00BCD4",
          secondary: "#546E7A",
          surface: "#1E2530",
          background: "#151B23",
        },
      },
    },
  },
  defaults: {
    VDataTable: { density: "compact" },
  },
});

createApp(App).use(vuetify).use(router).mount("#app");
