<template>
  <div v-if="loading">
    <v-progress-circular indeterminate class="d-flex mx-auto mt-10" />
  </div>
  <div v-else>
    <!-- Navigation -->
    <div class="d-flex align-center mb-4 gap-2">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <span v-if="match.season_name" class="text-caption text-medium-emphasis">{{ match.season_name }}</span>
    </div>

    <!-- Scoreboard header -->
    <v-card color="surface" class="mb-4" elevation="2">
      <v-card-text class="pa-4">
        <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-4">
          <span>{{ match.season_name }}{{ match.max_maps ? ` — BO${match.max_maps}` : '' }}</span>
          <span>{{ formatDate(match.start_time) }}</span>
        </div>

        <div class="d-flex align-center justify-center gap-4 flex-wrap">
          <!-- Team 1 -->
          <div class="d-flex align-center gap-3 flex-1" style="justify-content: flex-end">
            <div class="text-right">
              <div class="text-h6 font-weight-bold">{{ match.team1_name }}</div>
              <v-chip
                v-if="match.winner_id"
                size="x-small"
                :color="match.winner_id === match.team1_id ? 'success' : 'error'"
                variant="flat"
                class="mt-1"
              >{{ match.winner_id === match.team1_id ? 'VICTOIRE' : 'DÉFAITE' }}</v-chip>
            </div>
            <v-avatar
              :color="match.winner_id === match.team1_id ? 'success' : match.winner_id ? 'error' : 'primary'"
              size="44"
              class="text-body-1 font-weight-bold flex-shrink-0"
            >{{ teamInitials(match.team1_name) }}</v-avatar>
          </div>

          <!-- Score -->
          <div class="text-center px-4 flex-shrink-0">
            <div class="text-h3 font-weight-black d-flex align-center gap-2">
              <span :class="match.winner_id === match.team1_id ? 'text-success' : match.winner_id ? 'text-error' : ''">
                {{ match.team1_series_score ?? match.team1_score ?? 0 }}
              </span>
              <span class="text-medium-emphasis text-h4">:</span>
              <span :class="match.winner_id === match.team2_id ? 'text-success' : match.winner_id ? 'text-error' : ''">
                {{ match.team2_series_score ?? match.team2_score ?? 0 }}
              </span>
            </div>
          </div>

          <!-- Team 2 -->
          <div class="d-flex align-center gap-3 flex-1">
            <v-avatar
              :color="match.winner_id === match.team2_id ? 'success' : match.winner_id ? 'error' : 'primary'"
              size="44"
              class="text-body-1 font-weight-bold flex-shrink-0"
            >{{ teamInitials(match.team2_name) }}</v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ match.team2_name }}</div>
              <v-chip
                v-if="match.winner_id"
                size="x-small"
                :color="match.winner_id === match.team2_id ? 'success' : 'error'"
                variant="flat"
                class="mt-1"
              >{{ match.winner_id === match.team2_id ? 'VICTOIRE' : 'DÉFAITE' }}</v-chip>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Veto -->
    <v-card v-if="vetos.length" color="surface" class="mb-4 pa-3">
      <div class="text-caption text-medium-emphasis font-weight-medium mb-2">VETO</div>
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
          <span class="text-uppercase font-weight-medium text-caption">{{ map.map_name }}</span>
          <span
            class="ml-2 text-caption font-weight-bold"
            :class="map.team1_score > map.team2_score ? 'text-success' : map.team2_score > map.team1_score ? 'text-error' : 'text-medium-emphasis'"
          >{{ map.team1_score }} – {{ map.team2_score }}</span>
        </v-tab>
      </v-tabs>
      <v-divider />

      <div v-for="(map, i) in maps" :key="map.id" v-show="activeMap === i">
        <!-- Map sub-header -->
        <div class="d-flex align-center justify-space-between px-4 py-2 flex-wrap gap-2">
          <div class="d-flex align-center gap-2 text-body-2">
            <span class="font-weight-bold text-uppercase">{{ map.map_name }}</span>
            <span class="text-medium-emphasis">
              {{ match.team1_name }}
              <strong>{{ map.team1_score }}</strong>
              vs
              <strong>{{ map.team2_score }}</strong>
              {{ match.team2_name }}
            </span>
          </div>
          <v-btn
            v-if="map.demoFile"
            :href="`/demos/${map.demoFile}`"
            size="small"
            variant="outlined"
            prepend-icon="mdi-download"
            download
          >Démo</v-btn>
        </div>
        <v-divider />

        <!-- Teams -->
        <template v-for="team in teamsForMap(map)" :key="team.name">
          <div class="d-flex align-center gap-2 px-4 py-2 bg-surface-variant">
            <span class="text-subtitle-2 font-weight-bold">{{ team.name }}</span>
            <v-chip
              size="x-small"
              :color="team.score > team.opponentScore ? 'success' : 'error'"
              variant="tonal"
            >{{ team.score }} rounds</v-chip>
          </div>

          <v-data-table
            :headers="playerHeaders"
            :items="team.players"
            item-value="steam_id"
            :items-per-page="-1"
            hide-default-footer
            density="compact"
          >
            <template #item.name="{ item }">
              <div class="d-flex align-center gap-2">
                <v-avatar size="22" color="primary" variant="tonal" class="text-caption flex-shrink-0">
                  {{ item.name.charAt(0).toUpperCase() }}
                </v-avatar>
                <span class="text-body-2">{{ item.name }}</span>
              </div>
            </template>
            <template #item.rating="{ item }">
              <v-chip
                :color="ratingColor(item.rating)"
                size="x-small"
                variant="flat"
                class="font-weight-bold"
              >{{ item.rating }}</v-chip>
            </template>
            <template #item.kills="{ item }">
              <span class="font-weight-medium">{{ item.kills }}</span>
            </template>
            <template #item.deaths="{ item }">
              <span :class="item.deaths > item.kills ? 'text-error font-weight-medium' : ''">{{ item.deaths }}</span>
            </template>
            <template #item.kd="{ item }">
              <span :class="parseFloat(item.kd) >= 1 ? 'text-success' : 'text-error'">{{ item.kd }}</span>
            </template>
            <template #item.hs="{ item }">
              <div class="d-flex align-center gap-1" style="min-width:64px">
                <v-progress-linear
                  :model-value="parseFloat(item.hs)"
                  :color="parseFloat(item.hs) >= 50 ? 'success' : 'primary'"
                  height="4"
                  rounded
                  bg-color="rgba(255,255,255,0.1)"
                  style="width:36px; flex-shrink:0"
                />
                <span class="text-caption">{{ item.hs }}%</span>
              </div>
            </template>
            <template #item.adr="{ item }">{{ item.adr }}</template>
            <template #item.multikills="{ item }">
              <div class="d-flex gap-1 flex-wrap">
                <v-chip v-if="item.k5" color="error"   size="x-small" variant="flat">5K×{{ item.k5 }}</v-chip>
                <v-chip v-if="item.k4" color="warning" size="x-small" variant="flat">4K×{{ item.k4 }}</v-chip>
                <v-chip v-if="item.k3" color="info"    size="x-small" variant="tonal">3K×{{ item.k3 }}</v-chip>
                <v-chip v-if="item.k2" color="default" size="x-small" variant="tonal">2K×{{ item.k2 }}</v-chip>
                <span v-if="!item.k5 && !item.k4 && !item.k3 && !item.k2" class="text-medium-emphasis">—</span>
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

const route   = useRoute();
const loading = ref(true);
const match   = ref({});
const maps    = ref([]);
const vetos   = ref([]);
const activeMap = ref(0);

onMounted(async () => {
  const { data } = await getMatch(route.params.id);
  match.value = data.match;
  maps.value  = data.maps;
  vetos.value = data.vetos;
  loading.value = false;
});

const playerHeaders = [
  { title: "Joueur",     key: "name",       sortable: false },
  { title: "Rating",     key: "rating",     sortable: true  },
  { title: "K",          key: "kills",      sortable: true  },
  { title: "D",          key: "deaths",     sortable: true  },
  { title: "A",          key: "assists",    sortable: true  },
  { title: "K/D",        key: "kd",         sortable: true  },
  { title: "HS%",        key: "hs",         sortable: true  },
  { title: "ADR",        key: "adr",        sortable: true  },
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
  return [...teamMap.entries()].map(([name, ps]) => {
    const isTeam1    = name === match.value.team1_name;
    const score      = isTeam1 ? map.team1_score : map.team2_score;
    const opponentScore = isTeam1 ? map.team2_score : map.team1_score;
    return { name, players: ps, score, opponentScore };
  });
};

const teamInitials = (name) => {
  if (!name) return "?";
  const letter = name.charAt(0).toUpperCase();
  const nums   = (name.match(/\d+$/) || [""])[0];
  return letter + (nums || name.charAt(1)?.toUpperCase() || "");
};

const ratingColor = (r) => {
  if (r >= 1.2) return "primary";
  if (r >= 1.0) return "success";
  if (r >= 0.8) return "warning";
  return "error";
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "";
</script>
