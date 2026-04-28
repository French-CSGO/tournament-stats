<template>
  <v-app>
    <v-navigation-drawer permanent :width="220">
      <v-list-item title="Tournament Stats" class="py-4" />
      <v-divider />
      <v-list nav density="compact">
        <v-list-item prepend-icon="mdi-trophy"        title="Saisons"      to="/" exact />
        <v-list-item prepend-icon="mdi-shield-account" title="Équipes"      to="/teams" />
        <v-list-item prepend-icon="mdi-chart-bar"     title="Statistiques" to="/stats" />
        <v-divider class="my-2" />
        <v-list-item prepend-icon="mdi-cog"           title="Admin"        to="/admin" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
