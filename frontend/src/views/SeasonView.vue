<template>
  <div v-if="loading"><v-progress-circular indeterminate /></div>
  <div v-else>
    <div class="d-flex align-center mb-6 gap-4">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <h1 class="text-h5">{{ data.season.name }}</h1>
      <v-spacer />
      <v-btn prepend-icon="mdi-chart-bar" variant="tonal" size="small" :to="`/stats?season_id=${route.params.id}`">Stats détaillées</v-btn>
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
            :sort-by="[{ key: 'rating', order: 'desc' }]"
          >
            <template #item.rating="{ item }">
              <span :class="ratingColor(item.rating)">{{ item.rating }}</span>
            </template>
            <template #item.kd="{ item }">{{ item.kd }}</template>
            <template #item.hs="{ item }">{{ item.hs }}%</template>
            <template #item.adr="{ item }">{{ item.adr }}</template>
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
  { title: "Joueur", key: "name",       sortable: true },
  { title: "Rating", key: "rating",     sortable: true },
  { title: "K",      key: "kills",      sortable: true },
  { title: "D",      key: "deaths",     sortable: true },
  { title: "A",      key: "assists",    sortable: true },
  { title: "K/D",    key: "kd",         sortable: true },
  { title: "HS%",    key: "hs",         sortable: true },
  { title: "ADR",    key: "adr",        sortable: true },
  { title: "Maps",   key: "maps_played",sortable: true },
];

const playersComputed = computed(() =>
  data.value.players.map((p) => ({
    ...p,
    kd:  (p.kills / Math.max(p.deaths, 1)).toFixed(2),
    hs:  p.kills ? ((p.headshot_kills / p.kills) * 100).toFixed(0) : "0",
    adr: p.roundsplayed ? (p.damage / p.roundsplayed).toFixed(1) : "0",
  }))
);

const ratingColor = (r) => {
  if (r >= 1.2) return "text-success font-weight-bold";
  if (r >= 1.0) return "text-info";
  if (r >= 0.8) return "";
  return "text-error";
};

const winnerColor = (m, side) =>
  m.winner_id === (side === 1 ? m.team1_id : m.team2_id) ? "success" : "default";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "";
</script>
