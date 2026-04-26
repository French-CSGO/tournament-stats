<template>
  <div v-if="loading"><v-progress-circular indeterminate /></div>
  <div v-else>
    <div class="d-flex align-center mb-6 gap-4">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <h1 class="text-h5">{{ data.season.name }}</h1>
    </div>

    <v-row>
      <!-- Stats joueurs -->
      <v-col cols="12" lg="7">
        <v-card color="surface">
          <v-card-title class="text-subtitle-1">Stats joueurs</v-card-title>
          <v-data-table
            :headers="playerHeaders"
            :items="playersComputed"
            item-value="steam_id"
            :items-per-page="20"
            density="compact"
          >
            <template #item.kd="{ item }">
              {{ kd(item) }}
            </template>
            <template #item.hs="{ item }">
              {{ hs(item) }}%
            </template>
            <template #item.adr="{ item }">
              {{ adr(item) }}
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- Matchs -->
      <v-col cols="12" lg="5">
        <v-card color="surface">
          <v-card-title class="text-subtitle-1">Matchs</v-card-title>
          <v-list lines="two" density="compact">
            <v-list-item
              v-for="match in data.matches"
              :key="match.id"
              :to="`/match/${match.id}`"
              :subtitle="formatDate(match.start_time)"
            >
              <template #title>
                <span class="font-weight-medium">{{ match.team1_name }}</span>
                <v-chip
                  class="mx-2"
                  size="x-small"
                  :color="winnerColor(match, 1)"
                  variant="flat"
                >{{ match.team1_series_score ?? match.team1_score }}</v-chip>
                <span class="text-medium-emphasis">vs</span>
                <v-chip
                  class="mx-2"
                  size="x-small"
                  :color="winnerColor(match, 2)"
                  variant="flat"
                >{{ match.team2_series_score ?? match.team2_score }}</v-chip>
                <span class="font-weight-medium">{{ match.team2_name }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getSeason } from "../api/index.js";

const route = useRoute();
const loading = ref(true);
const data = ref({ season: {}, matches: [], players: [] });

onMounted(async () => {
  const { data: d } = await getSeason(route.params.id);
  data.value = d;
  loading.value = false;
});

const playerHeaders = [
  { title: "Joueur", key: "name", sortable: true },
  { title: "K", key: "kills", sortable: true },
  { title: "D", key: "deaths", sortable: true },
  { title: "A", key: "assists", sortable: true },
  { title: "K/D", key: "kd", sortable: false },
  { title: "HS%", key: "hs", sortable: false },
  { title: "ADR", key: "adr", sortable: false },
  { title: "Maps", key: "maps_played", sortable: true },
];

const playersComputed = computed(() => data.value.players);

const kd = (p) => (p.kills / Math.max(p.deaths, 1)).toFixed(2);
const hs = (p) => p.kills ? ((p.headshot_kills / p.kills) * 100).toFixed(0) : "0";
const adr = (p) => p.roundsplayed ? (p.damage / p.roundsplayed).toFixed(1) : "0";

const winnerColor = (m, side) =>
  m.winner_id === (side === 1 ? m.team1_id : m.team2_id) ? "success" : "default";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "";
</script>
