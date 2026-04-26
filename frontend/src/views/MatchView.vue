<template>
  <div v-if="loading"><v-progress-circular indeterminate /></div>
  <div v-else>
    <div class="d-flex align-center mb-4 gap-4">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <span v-if="match.season_name" class="text-caption text-medium-emphasis">{{ match.season_name }}</span>
    </div>

    <!-- Header match -->
    <v-card color="surface" class="mb-4 pa-4">
      <div class="d-flex align-center justify-center gap-6 flex-wrap">
        <div class="text-right flex-1">
          <div class="text-h6">{{ match.team1_name }}</div>
        </div>
        <div class="text-center">
          <div class="text-h4 font-weight-bold">
            <span :class="match.winner_id === match.team1_id ? 'text-success' : ''">
              {{ match.team1_series_score ?? match.team1_score }}
            </span>
            <span class="text-medium-emphasis mx-2">—</span>
            <span :class="match.winner_id === match.team2_id ? 'text-success' : ''">
              {{ match.team2_series_score ?? match.team2_score }}
            </span>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">{{ formatDate(match.start_time) }}</div>
        </div>
        <div class="flex-1">
          <div class="text-h6">{{ match.team2_name }}</div>
        </div>
      </div>
    </v-card>

    <!-- Veto -->
    <v-card v-if="vetos.length" color="surface" class="mb-4 pa-3">
      <v-card-title class="text-subtitle-2 mb-2">Veto</v-card-title>
      <div class="d-flex flex-wrap gap-2">
        <v-chip
          v-for="v in vetos"
          :key="v.id"
          :color="v.pick_or_veto === 'pick' ? 'success' : 'error'"
          variant="tonal"
          size="small"
        >
          <v-icon start size="12">{{ v.pick_or_veto === 'pick' ? 'mdi-check' : 'mdi-close' }}</v-icon>
          {{ v.team_name }} — {{ v.map }}
        </v-chip>
      </div>
    </v-card>

    <!-- Maps -->
    <v-card color="surface">
      <v-tabs v-model="activeMap" bg-color="surface">
        <v-tab v-for="(map, i) in maps" :key="map.id" :value="i">
          {{ map.map_name }}
          <span class="ml-2 text-caption text-medium-emphasis">
            {{ map.team1_score }}–{{ map.team2_score }}
          </span>
        </v-tab>
      </v-tabs>

      <div v-for="(map, i) in maps" :key="map.id" v-show="activeMap === i">
        <!-- Score par side -->
        <div class="d-flex justify-center align-center gap-8 pa-3 text-center flex-wrap">
          <div>
            <div class="text-caption text-medium-emphasis">{{ match.team1_name }}</div>
            <div class="text-h6">{{ map.team1_score }}</div>
            <div class="text-caption">
              CT {{ map.team1_first_side === 'ct' ? map.team1_score_ct : map.team1_score_t }}
              / T {{ map.team1_first_side === 'ct' ? map.team1_score_t : map.team1_score_ct }}
            </div>
          </div>
          <div class="text-h6 text-medium-emphasis">vs</div>
          <div>
            <div class="text-caption text-medium-emphasis">{{ match.team2_name }}</div>
            <div class="text-h6">{{ map.team2_score }}</div>
            <div class="text-caption">
              CT {{ map.team1_first_side !== 'ct' ? map.team2_score_ct : map.team2_score_t }}
              / T {{ map.team1_first_side !== 'ct' ? map.team2_score_t : map.team2_score_ct }}
            </div>
          </div>
          <div v-if="map.demoFile">
            <v-btn
              :href="`/demos/${map.demoFile}`"
              size="small"
              variant="outlined"
              prepend-icon="mdi-download"
              download
            >Démo</v-btn>
          </div>
        </div>

        <!-- Stats joueurs par équipe -->
        <template v-for="team in teamsForMap(map)" :key="team.name">
          <div class="px-4 py-2 bg-surface-variant text-subtitle-2">{{ team.name }}</div>
          <v-data-table
            :headers="playerHeaders"
            :items="team.players"
            item-value="steam_id"
            :items-per-page="-1"
            hide-default-footer
            density="compact"
          >
            <template #item.rating="{ item }">
              <span :class="ratingColor(item.rating)">{{ item.rating }}</span>
            </template>
            <template #item.kd="{ item }">{{ item.kd }}</template>
            <template #item.hs="{ item }">{{ item.hs }}%</template>
            <template #item.adr="{ item }">{{ item.adr }}</template>
            <template #item.multikills="{ item }">
              <div class="d-flex gap-1 flex-wrap">
                <v-chip v-if="item.k5" color="error"   size="x-small" variant="flat">5K <strong class="ml-1">×{{ item.k5 }}</strong></v-chip>
                <v-chip v-if="item.k4" color="warning" size="x-small" variant="flat">4K <strong class="ml-1">×{{ item.k4 }}</strong></v-chip>
                <v-chip v-if="item.k3" color="info"    size="x-small" variant="tonal">3K <strong class="ml-1">×{{ item.k3 }}</strong></v-chip>
                <v-chip v-if="item.k2" color="default" size="x-small" variant="tonal">2K <strong class="ml-1">×{{ item.k2 }}</strong></v-chip>
              </div>
            </template>
          </v-data-table>
        </template>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getMatch } from "../api/index.js";

const route = useRoute();
const loading = ref(true);
const match = ref({});
const maps = ref([]);
const vetos = ref([]);
const activeMap = ref(0);

onMounted(async () => {
  const { data } = await getMatch(route.params.id);
  match.value = data.match;
  maps.value = data.maps;
  vetos.value = data.vetos;
  loading.value = false;
});

const playerHeaders = [
  { title: "Joueur",     key: "name",       sortable: false },
  { title: "Rating",     key: "rating",     sortable: true },
  { title: "K",          key: "kills",      sortable: true },
  { title: "D",          key: "deaths",     sortable: true },
  { title: "A",          key: "assists",    sortable: true },
  { title: "K/D",        key: "kd",         sortable: true },
  { title: "HS%",        key: "hs",         sortable: true },
  { title: "ADR",        key: "adr",        sortable: true },
  { title: "Multikills", key: "multikills", sortable: false },
];

const enrichedPlayers = (players) =>
  players.map((p) => ({
    ...p,
    kd:  (p.kills / Math.max(p.deaths, 1)).toFixed(2),
    hs:  p.kills ? ((p.headshot_kills / p.kills) * 100).toFixed(0) : "0",
    adr: p.roundsplayed ? (p.damage / p.roundsplayed).toFixed(1) : "0",
  }));

const teamsForMap = (map) => {
  const players = enrichedPlayers(map.players);
  const teamMap = new Map();
  for (const p of players) {
    if (!teamMap.has(p.team_name)) teamMap.set(p.team_name, []);
    teamMap.get(p.team_name).push(p);
  }
  return [...teamMap.entries()].map(([name, players]) => ({ name, players }));
};

const ratingColor = (r) => {
  if (r >= 1.2) return "text-success font-weight-bold";
  if (r >= 1.0) return "text-info";
  if (r >= 0.8) return "";
  return "text-error";
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "";
</script>
