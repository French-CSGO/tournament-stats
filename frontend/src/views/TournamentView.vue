<template>
  <div>
    <!-- Navigation -->
    <div class="d-flex align-center mb-4 gap-2">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <span class="text-caption text-medium-emphasis">{{ seasonName }}</span>
    </div>

    <v-progress-circular v-if="loading" indeterminate class="d-block mx-auto mt-10" />

    <div v-else-if="error" class="text-center mt-10">
      <v-icon size="48" color="error">mdi-alert-circle-outline</v-icon>
      <div class="text-body-1 mt-2">{{ error }}</div>
    </div>

    <div v-else>
      <!-- Sélecteur de tournoi si plusieurs -->
      <div v-if="tournaments.length > 1" class="mb-4">
        <v-tabs v-model="activeTournament" color="primary" density="compact">
          <v-tab v-for="t in tournaments" :key="t.challonge_slug" :value="t.challonge_slug">
            {{ t.displayName }}
            <v-chip v-if="t.type" class="ml-2" size="x-small" :color="typeColor(t.type)" variant="tonal">
              {{ typeLabel(t.type) }}
            </v-chip>
          </v-tab>
        </v-tabs>
      </div>

      <!-- Contenu du tournoi actif -->
      <template v-if="current">
        <div class="d-flex align-center gap-3 mb-5 flex-wrap">
          <div>
            <h1 class="text-h5">{{ current.displayName }}</h1>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ typeLabel(current.type) }}
              <span v-if="current.tournament?.participants_count">
                · {{ current.tournament.participants_count }} participants
              </span>
              <span v-if="current.tournament?.state === 'complete'"> · Terminé</span>
            </div>
          </div>
          <v-spacer />
          <v-btn
            :href="`https://challonge.com/${activeTournament}`"
            target="_blank"
            prepend-icon="mdi-open-in-new"
            variant="tonal"
            size="small"
          >Voir sur Challonge</v-btn>
        </div>

        <!-- Round robin + bracket (deux phases distinctes) -->
        <template v-if="isGroupAndBracket">
          <v-card color="surface" class="pa-4 mb-4" style="overflow-x: auto">
            <div class="text-subtitle-1 mb-3">Phase de groupes</div>
            <BracketsViewerWrapper v-if="groupViewerData" :data="groupViewerData" :key="`${activeTournament}-groups`" />
          </v-card>
          <v-card color="surface" class="pa-4" style="overflow-x: auto">
            <div class="text-subtitle-1 mb-3">Bracket</div>
            <BracketsViewerWrapper v-if="bracketViewerData" :data="bracketViewerData" :key="`${activeTournament}-bracket`" />
          </v-card>
        </template>

        <!-- Bracket élimination / round robin simple via brackets-viewer -->
        <template v-else-if="isElim || isRoundRobin">
          <v-card color="surface" class="pa-4" style="overflow-x: auto">
            <BracketsViewerWrapper v-if="viewerData" :data="viewerData" :key="activeTournament" />
            <div v-else class="text-center py-6 text-medium-emphasis text-caption">
              Impossible de charger le bracket (données invalides ou type non supporté).
            </div>
          </v-card>
        </template>

        <!-- Swiss — affichage bracket style colonne par record -->
        <template v-else-if="current.type === 'swiss'">
          <v-row>
            <v-col cols="12" md="4">
              <v-card color="surface">
                <v-card-title class="text-subtitle-1">Classement</v-card-title>
                <v-data-table
                  :headers="standingsHeaders"
                  :items="standings"
                  density="compact"
                  :items-per-page="-1"
                  hide-default-footer
                >
                  <template #item.rank="{ item }">
                    <span class="text-medium-emphasis">{{ item.rank }}</span>
                  </template>
                  <template #item.name="{ item }">
                    <span :class="item.rank === 1 ? 'text-success font-weight-bold' : ''">{{ item.name }}</span>
                  </template>
                  <template #item.pts="{ item }">
                    <span class="font-weight-bold">{{ item.pts }}</span>
                  </template>
                </v-data-table>
              </v-card>
            </v-col>
            <v-col cols="12" md="8">
              <v-card color="surface" class="pa-4">
                <div class="text-subtitle-1 mb-3">Bracket</div>
                <SwissBracket :matches="current.matches" :participants="current.participants" />
              </v-card>
            </v-col>
          </v-row>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getSeasons, getSeasonTournaments, getTournament } from "../api/index.js";
import BracketsViewerWrapper from "../components/BracketsViewerWrapper.vue";
import SwissBracket from "../components/SwissBracket.vue";
import { challongeToViewerData, hasGroupAndBracketStages, challongeToViewerDataGroupBracket } from "../utils/challongeToViewer.js";

const route = useRoute();
const loading  = ref(true);
const error    = ref(null);
const seasonName       = ref("");
const tournaments      = ref([]);
const activeTournament = ref(null);
const bracketData      = ref({});

// ─── type helpers ──────────────────────────────────────────────────────────────

const typeLabel = (t) => ({
  "single elimination": "Élimination simple",
  "double elimination": "Élimination double",
  "round robin":        "Round Robin",
  "swiss":              "Swiss",
}[t] ?? t ?? "");

const typeColor = (t) => ({
  "single elimination": "primary",
  "double elimination": "secondary",
  "round robin":        "success",
  "swiss":              "warning",
}[t] ?? "default");

// ─── load ─────────────────────────────────────────────────────────────────────

async function loadTournamentData(slug) {
  if (bracketData.value[slug]) return;
  try {
    const { data } = await getTournament(slug);
    bracketData.value = { ...bracketData.value, [slug]: data };
    const entry = tournaments.value.find((t) => t.challonge_slug === slug);
    if (entry) {
      if (!entry.label) entry.displayName = data.tournament.name;
      entry.type = data.tournament.tournament_type;
    }
  } catch (e) {
    error.value = e.response?.data?.error ?? "Erreur lors du chargement du tournoi";
  }
}

onMounted(async () => {
  const seasonId = route.params.seasonId;
  const [{ data: seasons }, { data: list }] = await Promise.all([
    getSeasons(),
    getSeasonTournaments(seasonId).catch(() => ({ data: [] })),
  ]);

  seasonName.value = seasons.find((s) => s.id === parseInt(seasonId))?.name ?? "";
  tournaments.value = list.map((t) => ({ ...t, displayName: t.label || t.challonge_slug, type: null }));

  if (!tournaments.value.length) {
    error.value = "Aucun tournoi Challonge lié à cette saison.";
    loading.value = false;
    return;
  }

  const slugFromUrl = route.params.slug;
  activeTournament.value = slugFromUrl && list.find((t) => t.challonge_slug === slugFromUrl)
    ? slugFromUrl
    : list[0].challonge_slug;

  await loadTournamentData(activeTournament.value);
  loading.value = false;
});

watch(activeTournament, async (slug) => {
  if (slug) await loadTournamentData(slug);
});

// ─── current tournament ───────────────────────────────────────────────────────

const current = computed(() => {
  if (!activeTournament.value) return null;
  const entry = tournaments.value.find((t) => t.challonge_slug === activeTournament.value);
  const data  = bracketData.value[activeTournament.value];
  if (!entry || !data) return null;
  return { ...entry, ...data };
});

const participantsMap = computed(() => {
  if (!current.value) return {};
  return Object.fromEntries(current.value.participants.map((p) => [p.id, p]));
});

const isElim       = computed(() =>
  current.value?.type === "single elimination" || current.value?.type === "double elimination"
);
const isRoundRobin = computed(() => current.value?.type === "round robin");

// Detect mixed tournament (round robin groups + elimination bracket)
const isGroupAndBracket = computed(() => {
  if (!current.value) return false;
  return hasGroupAndBracketStages(current.value.matches);
});

// Separate viewer data for mixed tournaments
const _groupBracketData = computed(() => {
  if (!isGroupAndBracket.value) return null;
  try { return challongeToViewerDataGroupBracket(current.value); } catch { return null; }
});
const groupViewerData   = computed(() => _groupBracketData.value?.groupData   ?? null);
const bracketViewerData = computed(() => _groupBracketData.value?.bracketData ?? null);

// brackets-viewer data (single stage: elim or round robin)
const viewerData = computed(() => {
  if (!current.value || isGroupAndBracket.value) return null;
  if (!isElim.value && !isRoundRobin.value) return null;
  try {
    return challongeToViewerData(current.value);
  } catch {
    return null;
  }
});

// ─── swiss ────────────────────────────────────────────────────────────────────

function groupByRound(matches) {
  const map = {};
  for (const m of matches) (map[m.round] ??= []).push(m);
  return Object.keys(map).sort((a, b) => Number(a) - Number(b)).map((r) => map[r]);
}

const swissRounds = computed(() => {
  if (!current.value) return [];
  // Only show matches that have at least one participant assigned
  const played = current.value.matches.filter((m) => m.player1_id || m.player2_id);
  return groupByRound(played);
});

const standings = computed(() => {
  if (!current.value) return [];
  const pts = {}, wins = {}, losses = {};
  for (const p of current.value.participants) { pts[p.id] = 0; wins[p.id] = 0; losses[p.id] = 0; }
  for (const m of current.value.matches) {
    if (!m.winner_id) continue;
    pts[m.winner_id]   = (pts[m.winner_id]   ?? 0) + 1;
    wins[m.winner_id]  = (wins[m.winner_id]  ?? 0) + 1;
    const loser = m.player1_id === m.winner_id ? m.player2_id : m.player1_id;
    if (loser) losses[loser] = (losses[loser] ?? 0) + 1;
  }
  return current.value.participants
    .map((p) => ({ id: p.id, name: p.name, pts: pts[p.id] ?? 0, wins: wins[p.id] ?? 0, losses: losses[p.id] ?? 0, rank: p.final_rank ?? null }))
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999) || b.pts - a.pts)
    .map((p, i) => ({ ...p, rank: p.rank ?? i + 1 }));
});

const standingsHeaders = [
  { title: "#",       key: "rank",   sortable: false },
  { title: "Équipe",  key: "name",   sortable: false },
  { title: "V",       key: "wins",   sortable: false },
  { title: "D",       key: "losses", sortable: false },
  { title: "Pts",     key: "pts",    sortable: false },
];

</script>

<style scoped>
</style>
