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
        @update:model-value="load"
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
            <v-data-table
              :headers="playerHeaders"
              :items="data.players"
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
          <!-- Maps CT/T -->
          <v-card color="surface" class="mb-4">
            <v-card-title class="text-subtitle-1">Maps jouées</v-card-title>
            <div class="pa-3">
              <div v-for="m in data.mapStats" :key="m.map" class="mb-3">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span>{{ m.map }}</span>
                  <span class="text-medium-emphasis">{{ m.played }} maps</span>
                </div>
                <div class="d-flex rounded overflow-hidden" style="height:18px">
                  <div
                    :style="`width:${pct(m.ctWins, m.ctWins + m.tWins)}%;background:#3b82f6`"
                    :title="`CT: ${m.ctWins}`"
                  />
                  <div
                    :style="`width:${pct(m.tWins, m.ctWins + m.tWins)}%;background:#ef4444`"
                    :title="`T: ${m.tWins}`"
                  />
                </div>
                <div class="d-flex justify-space-between text-caption mt-1 text-medium-emphasis">
                  <span>CT {{ pct(m.ctWins, m.ctWins + m.tWins) }}%</span>
                  <span>T {{ pct(m.tWins, m.ctWins + m.tWins) }}%</span>
                </div>
              </div>
            </div>
          </v-card>

          <!-- Armes -->
          <v-card v-if="data.weaponData.length" color="surface">
            <v-card-title class="text-subtitle-1">Kills par arme</v-card-title>
            <div class="pa-3">
              <div v-for="w in data.weaponData" :key="w.weapon" class="mb-2">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span>{{ w.weapon }}</span>
                  <span class="text-medium-emphasis">{{ w.pct }}%</span>
                </div>
                <div class="rounded overflow-hidden" style="height:8px;background:#374151">
                  <div :style="`width:${w.pct}%;height:100%;background:${w.color}`" />
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getStats, getSeasons } from "../api/index.js";

const route = useRoute();
const loading = ref(true);
const selectedSeason = ref(route.query.season_id ? parseInt(route.query.season_id) : null);
const seasons = ref([]);
const data = ref({ kpis: {}, players: [], mapStats: [], weaponData: [] });

const seasonId   = computed(() => selectedSeason.value);
const seasonName = computed(() => seasons.value.find(s => s.id === seasonId.value)?.name || "");

async function load() {
  loading.value = true;
  const { data: d } = await getStats(selectedSeason.value);
  data.value = d;
  loading.value = false;
}

onMounted(async () => {
  const { data: s } = await getSeasons();
  seasons.value = s;
  await load();
});

const kpiCards = computed(() => [
  { label: "Matchs joués",  value: data.value.kpis.totalMatches ?? 0 },
  { label: "Maps jouées",   value: data.value.kpis.mapsPlayed ?? 0 },
  { label: "Total kills",   value: (data.value.kpis.totalKills ?? 0).toLocaleString("fr-FR") },
  { label: "ADR moyen",     value: data.value.kpis.avgAdr ?? 0 },
]);

const playerHeaders = [
  { title: "Joueur",  key: "name",    sortable: true },
  { title: "Équipe",  key: "team",    sortable: true },
  { title: "Rating",  key: "rating",  sortable: true },
  { title: "K",       key: "kills",   sortable: true },
  { title: "D",       key: "deaths",  sortable: true },
  { title: "K/D",     key: "kd",      sortable: true },
  { title: "HS%",     key: "hs",      sortable: true },
  { title: "ADR",     key: "adr",     sortable: true },
  { title: "Maps",    key: "maps",    sortable: true },
  { title: "Arme fav",key: "weapon",  sortable: false },
];

const ratingColor = (r) => {
  if (r >= 1.2) return "text-success font-weight-bold";
  if (r >= 1.0) return "text-info";
  if (r >= 0.8) return "";
  return "text-error";
};

const pct = (val, total) => total ? Math.round(val / total * 100) : 0;
</script>
