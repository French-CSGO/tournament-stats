<template>
  <div>
    <h1 class="text-h5 mb-6">Administration</h1>

    <!-- Code d'accès -->
    <v-card v-if="!authenticated" color="surface" class="mx-auto" max-width="400">
      <v-card-title>Accès restreint</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="codeInput"
          label="Code d'accès"
          type="password"
          @keyup.enter="login"
        />
        <v-alert v-if="loginError" type="error" density="compact" class="mt-2">Code incorrect</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="login">Accéder</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Panel admin -->
    <div v-else>
      <v-tabs v-model="tab" class="mb-4">
        <v-tab value="missing">
          <v-icon start>mdi-file-remove</v-icon>
          Démos manquantes
          <v-chip class="ml-2" size="x-small" color="error">{{ missing.length }}</v-chip>
        </v-tab>
        <v-tab value="broken">
          <v-icon start>mdi-file-alert</v-icon>
          Fichiers introuvables
          <v-chip class="ml-2" size="x-small" color="warning">{{ broken.length }}</v-chip>
        </v-tab>
      </v-tabs>

      <v-progress-circular v-if="loading" indeterminate />

      <div v-if="tab === 'missing' && !loading">
        <v-card color="surface">
          <v-card-subtitle class="pa-3">Maps terminées sans démo enregistrée en base</v-card-subtitle>
          <v-data-table
            :headers="demoHeaders"
            :items="missing"
            density="compact"
            :items-per-page="25"
          >
            <template #item.match_id="{ item }">
              <router-link :to="`/match/${item.match_id}`" class="text-primary">
                #{{ item.match_id }}
              </router-link>
            </template>
            <template #item.score="{ item }">
              {{ item.team1_name }} {{ item.team1_score }}–{{ item.team2_score }} {{ item.team2_name }}
            </template>
            <template #item.end_time="{ item }">
              {{ formatDate(item.end_time) }}
            </template>
          </v-data-table>
        </v-card>
      </div>

      <div v-if="tab === 'broken' && !loading">
        <v-card color="surface">
          <v-card-subtitle class="pa-3">Démo référencée en base mais fichier absent sur le serveur</v-card-subtitle>
          <v-data-table
            :headers="brokenHeaders"
            :items="broken"
            density="compact"
            :items-per-page="25"
          >
            <template #item.match_id="{ item }">
              <router-link :to="`/match/${item.match_id}`" class="text-primary">
                #{{ item.match_id }}
              </router-link>
            </template>
            <template #item.score="{ item }">
              {{ item.team1_name }} {{ item.team1_score }}–{{ item.team2_score }} {{ item.team2_name }}
            </template>
            <template #item.end_time="{ item }">
              {{ formatDate(item.end_time) }}
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { getAdminDemosMissing, getAdminDemosBroken } from "../api/index.js";

const codeInput   = ref("");
const loginError  = ref(false);
const authenticated = ref(false);
const tab         = ref("missing");
const loading     = ref(false);
const missing     = ref([]);
const broken      = ref([]);

const STORAGE_KEY = "admin_code";

function login() {
  loginError.value = false;
  loadData(codeInput.value);
}

async function loadData(code) {
  loading.value = true;
  try {
    const [m, b] = await Promise.all([
      getAdminDemosMissing(code),
      getAdminDemosBroken(code),
    ]);
    missing.value = m.data;
    broken.value  = b.data;
    localStorage.setItem(STORAGE_KEY, code);
    authenticated.value = true;
  } catch {
    loginError.value = true;
  } finally {
    loading.value = false;
  }
}

// Restaure la session si code déjà sauvegardé
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) loadData(saved);

const demoHeaders = [
  { title: "Match", key: "match_id", sortable: true },
  { title: "Map", key: "map_name", sortable: true },
  { title: "Score", key: "score", sortable: false },
  { title: "Date", key: "end_time", sortable: true },
];

const brokenHeaders = [
  { title: "Match", key: "match_id", sortable: true },
  { title: "Map", key: "map_name", sortable: true },
  { title: "Score", key: "score", sortable: false },
  { title: "Fichier", key: "demoFile", sortable: false },
  { title: "Date", key: "end_time", sortable: true },
];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
</script>
