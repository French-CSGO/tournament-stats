<template>
  <v-app>
    <!-- App bar — mobile only -->
    <v-app-bar v-if="mobile" color="surface" elevation="0" border="b">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title class="text-subtitle-1 font-weight-medium">Tournament Stats</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :permanent="!mobile"
      :temporary="mobile"
      :width="220"
    >
      <v-list-item title="Tournament Stats" subtitle="v0.3" class="py-4" />
      <v-divider />
      <v-list nav density="compact">
        <v-list-item prepend-icon="mdi-trophy"         title="Saisons"      to="/" exact />
        <v-list-item prepend-icon="mdi-shield-account" title="Équipes"      to="/teams" />
        <v-list-item prepend-icon="mdi-chart-bar"      title="Statistiques" to="/stats" />
      </v-list>

      <template #append>
        <v-divider />
        <v-list nav density="compact">
          <v-list-item
            prepend-icon="mdi-history"
            title="Changelog"
            href="https://github.com/French-CSGO/tournament-stats/releases"
            target="_blank"
          />
          <v-list-item prepend-icon="mdi-cog" title="Admin" to="/admin" />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-4 pa-md-6">
        <router-view />
      </v-container>

      <v-footer
        color="surface"
        border="t"
        class="text-caption text-medium-emphasis d-flex justify-space-between flex-wrap gap-2 px-6 py-3"
      >
        <span>Iwhite67</span>
        <a
          href="https://github.com/French-CSGO/tournament-stats"
          target="_blank"
          class="text-medium-emphasis text-decoration-none d-flex align-center gap-1"
        >
          <v-icon size="15">mdi-github</v-icon>
          French-CSGO/tournament-stats
        </a>
        <span>v0.3</span>
      </v-footer>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { useRoute } from "vue-router";

const { mobile } = useDisplay();
const drawer = ref(!mobile.value);
const route  = useRoute();

watch(() => route.path, () => { if (mobile.value) drawer.value = false; });
watch(mobile, (isMobile) => { drawer.value = !isMobile; });
</script>
