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

        <!-- Bracket élimination / round robin via brackets-viewer -->
        <template v-if="isElim || isRoundRobin">
          <v-card color="surface" class="pa-4">
            <BracketsViewerWrapper v-if="viewerData" :data="viewerData" :key="activeTournament" />
          </v-card>
        </template>

        <!-- Swiss — brackets-viewer ne supporte pas nativement, affichage manuel -->
        <template v-else-if="current.type === 'swiss'">
          <v-row>
            <v-col cols="12" md="5">
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
            <v-col cols="12" md="7">
              <v-card color="surface">
                <v-card-title class="text-subtitle-1">Rounds</v-card-title>
                <div
                  v-for="(round, ri) in swissRounds"
                  :key="ri"
                  class="swiss-round"
                >
                  <button class="swiss-round-header" @click="toggleRound(ri)">
                    <span>Round {{ ri + 1 }}</span>
                    <v-icon size="18">{{ openRounds.has(ri) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </button>
                  <div v-if="openRounds.has(ri)" class="swiss-round-body">
                    <div
                      class="round-matches-grid"
                      :style="{ gridTemplateColumns: `repeat(${Math.ceil(round.length / 2)}, 220px)` }"
                    >
                      <div v-for="m in round" :key="m.id" class="match-card">
                        <div class="match-side" :class="{ winner: m.winner_id === m.player1_id, loser: m.winner_id && m.winner_id !== m.player1_id }">
                          <span class="match-name text-body-2">{{ participantsMap[m.player1_id]?.name ?? '?' }}</span>
                          <v-chip size="x-small" :color="chipColor(m, 1)" variant="flat" class="match-score">{{ scoreP1(m) }}</v-chip>
                        </div>
                        <div class="match-sep" />
                        <div class="match-side" :class="{ winner: m.winner_id === m.player2_id, loser: m.winner_id && m.winner_id !== m.player2_id }">
                          <span class="match-name text-body-2">{{ participantsMap[m.player2_id]?.name ?? '?' }}</span>
                          <v-chip size="x-small" :color="chipColor(m, 2)" variant="flat" class="match-score">{{ scoreP2(m) }}</v-chip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
import { challongeToViewerData } from "../utils/challongeToViewer.js";

const route = useRoute();
const loading  = ref(true);
const error    = ref(null);
const seasonName       = ref("");
const tournaments      = ref([]);
const activeTournament = ref(null);
const bracketData      = ref({});
const openRounds       = ref(new Set());

function toggleRound(ri) {
  const s = new Set(openRounds.value);
  s.has(ri) ? s.delete(ri) : s.add(ri);
  openRounds.value = s;
}

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
  if (slug) {
    await loadTournamentData(slug);
    // open last round by default
    const data = bracketData.value[slug];
    if (data?.matches?.length) {
      const maxRound = Math.max(...data.matches.map((m) => m.round));
      openRounds.value = new Set([maxRound - 1]);
    }
  }
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

// brackets-viewer data (elim + round robin)
const viewerData = computed(() => {
  if (!current.value || (!isElim.value && !isRoundRobin.value)) return null;
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

// ─── score helpers ────────────────────────────────────────────────────────────

function parseScores(m) {
  if (!m.scores_csv) return [null, null];
  const parts = m.scores_csv.split(",").map((s) => s.split("-").map(Number));
  return [parts.reduce((a, p) => a + (p[0] ?? 0), 0), parts.reduce((a, p) => a + (p[1] ?? 0), 0)];
}
const scoreP1  = (m) => parseScores(m)[0] ?? "-";
const scoreP2  = (m) => parseScores(m)[1] ?? "-";
const chipColor = (m, side) => {
  if (!m.winner_id) return "default";
  return m.winner_id === (side === 1 ? m.player1_id : m.player2_id) ? "success" : "error";
};
</script>

<style scoped>
.swiss-round {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.swiss-round:last-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.swiss-round-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
}
.swiss-round-header:hover {
  background: rgba(255, 255, 255, 0.04);
}
.swiss-round-body {
  overflow-x: auto;
  padding: 12px 16px;
}
.round-matches-grid {
  display: grid;
  grid-template-rows: repeat(2, auto);
  grid-auto-flow: row;
  gap: 8px;
}

.match-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  background: #252e3d;
}
.match-side {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
}
.match-side.loser .match-name {
  opacity: 0.45;
}
.match-side.winner .match-name {
  font-weight: 600;
}
.match-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.match-score {
  flex-shrink: 0;
}
.match-sep {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}
</style>
