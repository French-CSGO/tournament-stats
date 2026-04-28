<template>
  <div>
    <div class="d-flex align-center mb-6 gap-4 flex-wrap">
      <h1 class="text-h5">{{ seasonId ? `Stats — ${seasonName}` : 'Statistiques globales' }}</h1>
      <v-spacer />
      <v-select
        v-model="selectedSeason"
        :items="seasons"
        item-title="name"
        item-value="id"
        label="Saison"
        density="compact"
        clearable
        clear-icon="mdi-close"
        placeholder="Toutes les saisons"
        style="max-width:220px"
        @update:model-value="onSeasonChange"
      />
    </div>

    <v-progress-circular v-if="loading" indeterminate class="d-block mx-auto" />

    <div v-else>
      <!-- KPIs -->
      <v-row class="mb-4">
        <v-col v-for="kpi in kpiCards" :key="kpi.label" cols="6" sm="3">
          <v-card color="surface" class="text-center pa-4">
            <div class="text-h5 font-weight-bold">{{ kpi.value }}</div>
            <div class="text-caption text-medium-emphasis mt-1">{{ kpi.label }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <!-- Top joueurs -->
        <v-col cols="12" lg="8">
          <v-card color="surface">
            <v-card-title class="text-subtitle-1">Top joueurs</v-card-title>
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
              density="compact"
              :items-per-page="20"
              :sort-by="[{ key: 'rating', order: 'desc' }]"
            >
              <template #item.rating="{ item }">
                <span :class="ratingColor(item.rating)">{{ item.rating }}</span>
              </template>
              <template #item.hs="{ item }">{{ item.hs }}%</template>
            </v-data-table>
          </v-card>
        </v-col>

        <!-- Colonne droite -->
        <v-col cols="12" lg="4">
          <!-- Camembert maps jouées -->
          <v-card color="surface" class="mb-4">
            <v-card-title class="text-subtitle-1">Maps jouées</v-card-title>
            <div class="pa-3 d-flex justify-center" style="max-height:280px">
              <Doughnut v-if="mapChartData" :data="mapChartData" :options="doughnutOptions" />
            </div>
          </v-card>

          <!-- Camembert armes -->
          <v-card v-if="data.weaponData.length" color="surface">
            <v-card-title class="text-subtitle-1">Kills par arme</v-card-title>
            <div class="pa-3 d-flex justify-center" style="max-height:280px">
              <Doughnut :data="weaponChartData" :options="doughnutOptions" />
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend
} from "chart.js";
import { getStats, getSeasons } from "../api/index.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const selectedSeason = ref(route.params.id ? parseInt(route.params.id) : null);
const seasons = ref([]);
const data = ref({ kpis: {}, players: [], mapStats: [], weaponData: [] });
const playerSearch = ref("");

const seasonId   = computed(() => selectedSeason.value);
const seasonName = computed(() => seasons.value.find(s => s.id === seasonId.value)?.name || "");

async function load() {
  loading.value = true;
  const { data: d } = await getStats(selectedSeason.value);
  data.value = d;
  loading.value = false;
}

function onSeasonChange(val) {
  if (val) router.push(`/stats/season/${val}`);
  else router.push("/stats");
}

watch(() => route.params.id, (id) => {
  selectedSeason.value = id ? parseInt(id) : null;
  load();
});

onMounted(async () => {
  const { data: s } = await getSeasons();
  seasons.value = s;
  await load();
});

const playersFiltered = computed(() => {
  const q = playerSearch.value?.toLowerCase().trim();
  if (!q) return data.value.players;
  return data.value.players.filter(
    (p) => p.name?.toLowerCase().includes(q) || p.steam_id?.toString().includes(q)
  );
});

const kpiCards = computed(() => [
  { label: "Matchs joués",  value: data.value.kpis.totalMatches ?? 0 },
  { label: "Maps jouées",   value: data.value.kpis.mapsPlayed ?? 0 },
  { label: "Total kills",   value: (data.value.kpis.totalKills ?? 0).toLocaleString("fr-FR") },
  { label: "ADR moyen",     value: data.value.kpis.avgAdr ?? 0 },
]);

const MAP_COLORS = [
  "#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6",
  "#06b6d4","#ec4899","#a78bfa","#34d399",
];

const mapChartData = computed(() => {
  if (!data.value.mapStats.length) return null;
  return {
    labels: data.value.mapStats.map(m => m.map),
    datasets: [{
      data: data.value.mapStats.map(m => m.played),
      backgroundColor: data.value.mapStats.map((_, i) => MAP_COLORS[i % MAP_COLORS.length]),
      borderWidth: 2,
      borderColor: "#1E2530",
    }],
  };
});

const weaponChartData = computed(() => ({
  labels: data.value.weaponData.map(w => w.weapon),
  datasets: [{
    data: data.value.weaponData.map(w => w.kills),
    backgroundColor: data.value.weaponData.map(w => w.color),
    borderWidth: 2,
    borderColor: "#1E2530",
  }],
}));

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: "#9ca3af",
        boxWidth: 12,
        padding: 10,
        font: { size: 11 },
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${ctx.formattedValue}`,
      },
    },
  },
};

const playerHeaders = [
  { title: "Joueur",   key: "name",    sortable: true },
  { title: "Équipe",   key: "team",    sortable: true },
  { title: "Rating",   key: "rating",  sortable: true },
  { title: "K",        key: "kills",   sortable: true },
  { title: "D",        key: "deaths",  sortable: true },
  { title: "K/D",      key: "kd",      sortable: true },
  { title: "HS%",      key: "hs",      sortable: true },
  { title: "ADR",      key: "adr",     sortable: true },
  { title: "Maps",     key: "maps",    sortable: true },
  { title: "Arme fav", key: "weapon",  sortable: false },
];

const ratingColor = (r) => {
  if (r >= 1.2) return "text-success font-weight-bold";
  if (r >= 1.0) return "text-info";
  if (r >= 0.8) return "";
  return "text-error";
};
</script>
