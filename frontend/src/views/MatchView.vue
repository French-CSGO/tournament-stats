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
          :color="v.pick_or_ban === 'pick' ? 'success' : 'error'"
          variant="tonal"
          size="small"
        >
          <v-icon start size="12">{{ v.pick_or_ban === 'pick' ? 'mdi-check' : 'mdi-close' }}</v-icon>
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
        <div class="d-flex justify-center gap-8 pa-3 text-center">
          <div>
            <div class="text-caption text-medium-emphasis">{{ match.team1_name }}</div>
            <div class="text-h6">{{ map.team1_score }}</div>
            <div class="text-caption">CT {{ map.team1_first_side === 'ct' ? map.team1_score_ct : map.team1_score_t }} / T {{ map.team1_first_side === 'ct' ? map.team1_score_t : map.team1_score_ct }}</div>
          </div>
          <div class="text-h6 text-medium-emphasis mt-3">vs</div>
          <div>
            <div class="text-caption text-medium-emphasis">{{ match.team2_name }}</div>
            <div class="text-h6">{{ map.team2_score }}</div>
            <div class="text-caption">CT {{ map.team1_first_side !== 'ct' ? map.team2_score_ct : map.team2_score_t }} / T {{ map.team1_first_side !== 'ct' ? map.team2_score_t : map.team2_score_ct }}</div>
          </div>
          <div v-if="map.demoFile" class="ml-4 mt-2">
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
        <v-data-table
          :headers="playerHeaders"
          :items="map.players"
          item-value="steam_id"
          :items-per-page="-1"
          hide-default-footer
          density="compact"
          group-by="[{ key: 'team_name' }]"
        >
          <template #group-header="{ item, toggleGroup, isGroupOpen }">
            <tr>
              <td :colspan="playerHeaders.length" class="bg-surface-variant">
                <v-btn
                  variant="text"
                  size="small"
                  :prepend-icon="isGroupOpen(item) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                  @click="toggleGroup(item)"
                >{{ item.value }}</v-btn>
              </td>
            </tr>
          </template>
          <template #item.kd="{ item }">{{ kd(item) }}</template>
          <template #item.hs="{ item }">{{ hs(item) }}%</template>
          <template #item.adr="{ item }">{{ adr(item) }}</template>
          <template #item.multikills="{ item }">
            <span v-if="item.k5" class="text-error font-weight-bold">5K×{{ item.k5 }} </span>
            <span v-if="item.k4" class="text-warning">4K×{{ item.k4 }} </span>
            <span v-if="item.k3">3K×{{ item.k3 }} </span>
            <span v-if="item.k2" class="text-medium-emphasis">2K×{{ item.k2 }}</span>
          </template>
        </v-data-table>
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
  { title: "Joueur", key: "name", sortable: false },
  { title: "K", key: "kills", sortable: false },
  { title: "D", key: "deaths", sortable: false },
  { title: "A", key: "assists", sortable: false },
  { title: "K/D", key: "kd", sortable: false },
  { title: "HS%", key: "hs", sortable: false },
  { title: "ADR", key: "adr", sortable: false },
  { title: "Multikills", key: "multikills", sortable: false },
];

const kd = (p) => (p.kills / Math.max(p.deaths, 1)).toFixed(2);
const hs = (p) => p.kills ? ((p.headshot_kills / p.kills) * 100).toFixed(0) : "0";
const adr = (p) => p.roundsplayed ? (p.damage / p.roundsplayed).toFixed(1) : "0";
const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "";
</script>
