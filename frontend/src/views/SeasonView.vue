<template>
  <div v-if="loading"><v-progress-circular indeterminate /></div>
  <div v-else>
    <div class="d-flex align-center mb-6 gap-4">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <h1 class="text-h5">{{ data.season.name }}</h1>
      <v-spacer />
      <v-btn prepend-icon="mdi-chart-bar" variant="tonal" size="small" :to="`/stats/season/${route.params.id}`">Stats détaillées</v-btn>
    </div>

    <v-row>
      <!-- Stats joueurs -->
      <v-col cols="12" lg="7">
        <v-card color="surface">
          <v-card-title class="text-subtitle-1">Stats joueurs</v-card-title>
          <div class="px-4 pb-2">
            <v-text-field
              v-model="playerSearch"
              prepend-inner-icon="mdi-magnify"
              placeholder="Nom ou SteamID..."
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </div>
          <v-data-table
            :headers="playerHeaders"
            :items="playersFiltered"
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
          <div class="px-4 pb-2">
            <v-text-field
              v-model="matchSearch"
              prepend-inner-icon="mdi-magnify"
              placeholder="Nom d'équipe..."
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </div>
          <v-data-table
            :headers="matchHeaders"
            :items="matchesFiltered"
            :items-per-page="10"
            density="compact"
            :sort-by="[{ key: 'start_time', order: 'desc' }]"
          >
            <template #item.match="{ item }">
              <router-link :to="`/match/${item.id}`" class="text-decoration-none text-primary">
                <span :class="item.winner_id === item.team1_id ? 'font-weight-bold' : 'text-medium-emphasis'">
                  {{ item.team1_name }}
                </span>
                <v-chip class="mx-1" size="x-small" :color="winnerColor(item, 1)" variant="flat">
                  {{ matchScore(item).t1 }}
                </v-chip>
                <span class="text-medium-emphasis">–</span>
                <v-chip class="mx-1" size="x-small" :color="winnerColor(item, 2)" variant="flat">
                  {{ matchScore(item).t2 }}
                </v-chip>
                <span :class="item.winner_id === item.team2_id ? 'font-weight-bold' : 'text-medium-emphasis'">
                  {{ item.team2_name }}
                </span>
              </router-link>
            </template>
            <template #item.start_time="{ item }">
              <span class="text-caption text-medium-emphasis">{{ formatDate(item.start_time) }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getSeason } from "../api/index.js";
import { matchScore } from "../utils/matchScore.js";

const route = useRoute();
const loading = ref(true);
const data = ref({ season: {}, matches: [], players: [] });
const playerSearch = ref("");
const matchSearch  = ref("");

onMounted(async () => {
  const { data: d } = await getSeason(route.params.id);
  data.value = d;
  loading.value = false;
});

const matchHeaders = [
  { title: "Match", key: "match",      sortable: false },
  { title: "Date",  key: "start_time", sortable: true  },
];

const playerHeaders = [
  { title: "Joueur", key: "name",        sortable: true },
  { title: "Rating", key: "rating",      sortable: true },
  { title: "K",      key: "kills",       sortable: true },
  { title: "D",      key: "deaths",      sortable: true },
  { title: "A",      key: "assists",     sortable: true },
  { title: "K/D",    key: "kd",          sortable: true },
  { title: "HS%",    key: "hs",          sortable: true },
  { title: "ADR",    key: "adr",         sortable: true },
  { title: "Maps",   key: "maps_played", sortable: true },
];

const playersComputed = computed(() =>
  data.value.players.map((p) => ({
    ...p,
    kd:  (p.kills / Math.max(p.deaths, 1)).toFixed(2),
    hs:  p.kills ? ((p.headshot_kills / p.kills) * 100).toFixed(0) : "0",
    adr: p.roundsplayed ? (p.damage / p.roundsplayed).toFixed(1) : "0",
  }))
);

const playersFiltered = computed(() => {
  const q = playerSearch.value?.toLowerCase().trim();
  if (!q) return playersComputed.value;
  return playersComputed.value.filter(
    (p) => p.name?.toLowerCase().includes(q) || p.steam_id?.toString().includes(q)
  );
});

const matchesFiltered = computed(() => {
  const q = matchSearch.value?.toLowerCase().trim();
  if (!q) return data.value.matches;
  return data.value.matches.filter(
    (m) =>
      m.team1_name?.toLowerCase().includes(q) ||
      m.team2_name?.toLowerCase().includes(q)
  );
});

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
