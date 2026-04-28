<template>
  <div>
    <h1 class="text-h5 mb-6">Équipes</h1>

    <v-text-field
      v-model="search"
      prepend-inner-icon="mdi-magnify"
      placeholder="Rechercher une équipe..."
      variant="outlined"
      density="compact"
      clearable
      class="mb-4"
      style="max-width: 360px"
    />

    <v-row v-if="loading">
      <v-col v-for="n in 6" :key="n" cols="12" sm="4" md="3">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
        v-for="team in filtered"
        :key="team.id"
        cols="12" sm="6" md="4" lg="3"
      >
        <v-card color="surface" hover :to="`/teams/${team.id}`">
          <v-card-title class="text-subtitle-1">{{ team.name }}</v-card-title>
          <v-card-text>
            <v-chip v-if="team.tag" size="x-small" class="mr-1">{{ team.tag }}</v-chip>
            <v-chip size="x-small" variant="tonal" color="primary">{{ team.match_count }} matchs</v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog équipe -->
    <v-dialog v-model="dialog" max-width="900" @update:model-value="v => !v && router.push('/teams')">
      <v-card v-if="selected" color="surface">
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <span>{{ selected.team.name }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>

        <v-card-text>
          <!-- Stats joueurs -->
          <div class="text-subtitle-2 mb-2">Joueurs</div>
          <v-data-table
            :headers="playerHeaders"
            :items="playersComputed"
            item-value="steam_id"
            density="compact"
            :items-per-page="10"
            class="mb-4"
          >
            <template #item.kd="{ item }">{{ kd(item) }}</template>
            <template #item.hs="{ item }">{{ hs(item) }}%</template>
            <template #item.adr="{ item }">{{ adr(item) }}</template>
          </v-data-table>

          <!-- Matchs -->
          <div class="text-subtitle-2 mb-2">Matchs récents</div>
          <v-list density="compact">
            <v-list-item
              v-for="m in selected.matches.slice(0, 10)"
              :key="m.id"
              :to="`/match/${m.id}`"
              :subtitle="m.season_name"
              @click="closeDialog"
            >
              <template #title>
                <span>{{ m.team1_name }}</span>
                <v-chip size="x-small" :color="m.winner_id === m.team1_id ? 'success' : 'default'" class="mx-1">{{ m.team1_series_score ?? m.team1_score }}</v-chip>
                <span class="text-medium-emphasis">vs</span>
                <v-chip size="x-small" :color="m.winner_id === m.team2_id ? 'success' : 'default'" class="mx-1">{{ m.team2_series_score ?? m.team2_score }}</v-chip>
                <span>{{ m.team2_name }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getTeams, getTeam } from "../api/index.js";

const route = useRoute();
const router = useRouter();
const teams = ref([]);
const loading = ref(true);
const search = ref("");
const dialog = ref(false);
const selected = ref(null);

onMounted(async () => {
  const { data } = await getTeams();
  teams.value = data;
  loading.value = false;
  if (route.params.id) await loadTeam(parseInt(route.params.id));
});

watch(() => route.params.id, async (id) => {
  if (id) await loadTeam(parseInt(id));
  else { dialog.value = false; selected.value = null; }
});

async function loadTeam(id) {
  const { data } = await getTeam(id);
  selected.value = data;
  dialog.value = true;
}

const filtered = computed(() =>
  search.value
    ? teams.value.filter((t) =>
        t.name.toLowerCase().includes(search.value.toLowerCase()) ||
        (t.tag || "").toLowerCase().includes(search.value.toLowerCase())
      )
    : teams.value
);

function closeDialog() {
  dialog.value = false;
  router.push("/teams");
}

const playersComputed = computed(() => selected.value?.players ?? []);

const playerHeaders = [
  { title: "Joueur", key: "name" },
  { title: "K", key: "kills" },
  { title: "D", key: "deaths" },
  { title: "A", key: "assists" },
  { title: "K/D", key: "kd" },
  { title: "HS%", key: "hs" },
  { title: "ADR", key: "adr" },
  { title: "Maps", key: "maps_played" },
];

const kd = (p) => (p.kills / Math.max(p.deaths, 1)).toFixed(2);
const hs = (p) => p.kills ? ((p.headshot_kills / p.kills) * 100).toFixed(0) : "0";
const adr = (p) => p.roundsplayed ? (p.damage / p.roundsplayed).toFixed(1) : "0";
</script>
