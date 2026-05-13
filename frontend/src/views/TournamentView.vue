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
          <v-tab v-for="t in tournaments" :key="t.challonge_url" :value="t.challonge_url">
            {{ t.displayName }}
            <v-chip v-if="t.type" class="ml-2" size="x-small" :color="typeColor(t.type)" variant="tonal">
              {{ typeLabel(t.type) }}
            </v-chip>
          </v-tab>
        </v-tabs>
      </div>

      <!-- Contenu du tournoi actif -->
      <template v-if="current">
        <div class="d-flex align-center gap-3 mb-4 flex-wrap">
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

        <!-- Bracket élimination -->
        <template v-if="isElim">
          <div v-if="current.type === 'double elimination'" class="mb-2">
            <v-chip size="small" color="primary" class="mr-2" variant="tonal">Upper Bracket</v-chip>
          </div>
          <div class="bracket-scroll">
            <div class="bracket-grid">
              <div
                v-for="(round, ri) in upperRounds"
                :key="ri"
                class="bracket-round"
              >
                <div class="round-label text-caption text-medium-emphasis mb-2">
                  {{ roundLabel(round[0]?.round, current.type) }}
                </div>
                <BracketMatch
                  v-for="m in round"
                  :key="m.id"
                  :match="m"
                  :participants="participantsMap"
                />
              </div>
            </div>
          </div>

          <template v-if="current.type === 'double elimination' && lowerRounds.length">
            <div class="mt-6 mb-2">
              <v-chip size="small" color="error" variant="tonal">Lower Bracket</v-chip>
            </div>
            <div class="bracket-scroll">
              <div class="bracket-grid">
                <div
                  v-for="(round, ri) in lowerRounds"
                  :key="ri"
                  class="bracket-round"
                >
                  <div class="round-label text-caption text-medium-emphasis mb-2">
                    Loser R{{ Math.abs(round[0]?.round) }}
                  </div>
                  <BracketMatch
                    v-for="m in round"
                    :key="m.id"
                    :match="m"
                    :participants="participantsMap"
                  />
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- Round Robin -->
        <template v-else-if="current.type === 'round robin'">
          <v-row>
            <v-col cols="12" md="5">
              <v-card color="surface">
                <v-card-title class="text-subtitle-1">Classement</v-card-title>
                <v-data-table
                  :headers="rrHeaders"
                  :items="rrStandings"
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
                <v-card-title class="text-subtitle-1">Résultats par round</v-card-title>
                <v-expansion-panels variant="accordion" flat>
                  <v-expansion-panel
                    v-for="(round, ri) in rrRounds"
                    :key="ri"
                    :title="`Round ${ri + 1}`"
                    color="surface"
                  >
                    <template #text>
                      <div
                        v-for="m in round"
                        :key="m.id"
                        class="d-flex align-center justify-space-between py-1 border-b"
                      >
                        <span
                          :class="m.winner_id === m.player1_id ? 'font-weight-bold' : 'text-medium-emphasis'"
                          class="text-body-2 flex-1 text-right pr-2"
                        >{{ participantsMap[m.player1_id]?.name ?? '?' }}</span>
                        <v-chip size="x-small" :color="matchChipColor(m, 1)" variant="flat" class="mx-1">
                          {{ scoreP1(m) }}
                        </v-chip>
                        <span class="text-caption text-medium-emphasis mx-1">–</span>
                        <v-chip size="x-small" :color="matchChipColor(m, 2)" variant="flat" class="mx-1">
                          {{ scoreP2(m) }}
                        </v-chip>
                        <span
                          :class="m.winner_id === m.player2_id ? 'font-weight-bold' : 'text-medium-emphasis'"
                          class="text-body-2 flex-1 pl-2"
                        >{{ participantsMap[m.player2_id]?.name ?? '?' }}</span>
                      </div>
                    </template>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card>
            </v-col>
          </v-row>
        </template>

        <!-- Swiss -->
        <template v-else-if="current.type === 'swiss'">
          <v-row>
            <v-col cols="12" md="5">
              <v-card color="surface">
                <v-card-title class="text-subtitle-1">Classement</v-card-title>
                <v-data-table
                  :headers="rrHeaders"
                  :items="rrStandings"
                  density="compact"
                  :items-per-page="-1"
                  hide-default-footer
                />
              </v-card>
            </v-col>
            <v-col cols="12" md="7">
              <v-card color="surface">
                <v-card-title class="text-subtitle-1">Rounds</v-card-title>
                <v-expansion-panels variant="accordion" flat>
                  <v-expansion-panel
                    v-for="(round, ri) in rrRounds"
                    :key="ri"
                    :title="`Round ${ri + 1}`"
                    color="surface"
                  >
                    <template #text>
                      <div
                        v-for="m in round"
                        :key="m.id"
                        class="d-flex align-center justify-space-between py-1 border-b"
                      >
                        <span
                          :class="m.winner_id === m.player1_id ? 'font-weight-bold' : 'text-medium-emphasis'"
                          class="text-body-2 flex-1 text-right pr-2"
                        >{{ participantsMap[m.player1_id]?.name ?? '?' }}</span>
                        <v-chip size="x-small" :color="matchChipColor(m, 1)" variant="flat" class="mx-1">
                          {{ scoreP1(m) }}
                        </v-chip>
                        <span class="text-caption text-medium-emphasis mx-1">–</span>
                        <v-chip size="x-small" :color="matchChipColor(m, 2)" variant="flat" class="mx-1">
                          {{ scoreP2(m) }}
                        </v-chip>
                        <span
                          :class="m.winner_id === m.player2_id ? 'font-weight-bold' : 'text-medium-emphasis'"
                          class="text-body-2 flex-1 pl-2"
                        >{{ participantsMap[m.player2_id]?.name ?? '?' }}</span>
                      </div>
                    </template>
                  </v-expansion-panel>
                </v-expansion-panels>
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
import BracketMatch from "../components/BracketMatch.vue";

const route = useRoute();

const loading = ref(true);
const error   = ref(null);
const seasonName      = ref("");
const tournaments     = ref([]);   // list from DB (with displayName + type once fetched)
const activeTournament = ref(null);
const bracketData     = ref({});   // slug -> { tournament, participants, matches }

// ─── helpers ──────────────────────────────────────────────────────────────────

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
    // update displayName + type on the tournament entry
    const entry = tournaments.value.find((t) => t.challonge_url === slug);
    if (entry) {
      if (!entry.name) entry.displayName = data.tournament.name;
      entry.type = data.tournament.tournament_type;
    }
  } catch (e) {
    error.value = e.response?.data?.error ?? "Erreur de chargement du tournoi";
  }
}

onMounted(async () => {
  const seasonId = route.params.seasonId;

  const [{ data: seasons }, { data: list }] = await Promise.all([
    getSeasons(),
    getSeasonTournaments(seasonId),
  ]);

  seasonName.value = seasons.find((s) => s.id === parseInt(seasonId))?.name ?? "";
  tournaments.value = list.map((t) => ({ ...t, displayName: t.name || t.challonge_url, type: null }));

  if (!tournaments.value.length) {
    error.value = "Aucun tournoi Challonge lié à cette saison.";
    loading.value = false;
    return;
  }

  // default to slug from URL or first
  const slugFromUrl = route.params.slug;
  activeTournament.value = slugFromUrl && list.find((t) => t.challonge_url === slugFromUrl)
    ? slugFromUrl
    : list[0].challonge_url;

  await loadTournamentData(activeTournament.value);
  loading.value = false;
});

watch(activeTournament, async (slug) => {
  if (slug) await loadTournamentData(slug);
});

// ─── current tournament computed ─────────────────────────────────────────────

const current = computed(() => {
  if (!activeTournament.value) return null;
  const entry = tournaments.value.find((t) => t.challonge_url === activeTournament.value);
  const data  = bracketData.value[activeTournament.value];
  if (!entry || !data) return null;
  return { ...entry, ...data };
});

const participantsMap = computed(() => {
  if (!current.value) return {};
  return Object.fromEntries(current.value.participants.map((p) => [p.id, p]));
});

// ─── bracket (elim) ───────────────────────────────────────────────────────────

const isElim = computed(() =>
  current.value?.type === "single elimination" || current.value?.type === "double elimination"
);

function groupByRound(matches) {
  const map = {};
  for (const m of matches) {
    (map[m.round] ??= []).push(m);
  }
  return Object.keys(map)
    .sort((a, b) => Number(a) - Number(b))
    .map((r) => map[r]);
}

const upperRounds = computed(() => {
  if (!current.value) return [];
  const upper = current.value.matches.filter((m) => m.round > 0);
  return groupByRound(upper);
});

const lowerRounds = computed(() => {
  if (!current.value) return [];
  const lower = current.value.matches.filter((m) => m.round < 0);
  return groupByRound(lower);
});

const roundLabel = (round, type) => {
  if (!round) return "";
  const upper = current.value?.matches.filter((m) => m.round > 0) ?? [];
  const maxRound = Math.max(...upper.map((m) => m.round));
  if (round === maxRound) return "Finale";
  if (round === maxRound - 1 && type === "double elimination") return "Grande Finale";
  if (round === maxRound - 1) return "Demi-finales";
  if (round === maxRound - 2) return "Quarts de finale";
  return `Round ${round}`;
};

// ─── round robin / swiss ──────────────────────────────────────────────────────

const rrRounds = computed(() => {
  if (!current.value) return [];
  return groupByRound(current.value.matches.filter((m) => m.state === "complete" || m.scores_csv));
});

const rrStandings = computed(() => {
  if (!current.value) return [];
  const pts = {};
  const wins = {}, losses = {};

  for (const p of current.value.participants) {
    pts[p.id] = 0; wins[p.id] = 0; losses[p.id] = 0;
  }

  for (const m of current.value.matches) {
    if (!m.winner_id) continue;
    pts[m.winner_id] = (pts[m.winner_id] ?? 0) + 1;
    wins[m.winner_id] = (wins[m.winner_id] ?? 0) + 1;
    const loser = m.player1_id === m.winner_id ? m.player2_id : m.player1_id;
    if (loser) losses[loser] = (losses[loser] ?? 0) + 1;
  }

  return current.value.participants
    .map((p) => ({
      id:     p.id,
      name:   p.name,
      pts:    pts[p.id] ?? 0,
      wins:   wins[p.id] ?? 0,
      losses: losses[p.id] ?? 0,
      rank:   p.final_rank ?? null,
    }))
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999) || b.pts - a.pts)
    .map((p, i) => ({ ...p, rank: p.rank ?? i + 1 }));
});

const rrHeaders = [
  { title: "#",    key: "rank",   sortable: false },
  { title: "Équipe", key: "name", sortable: false },
  { title: "V",    key: "wins",   sortable: false },
  { title: "D",    key: "losses", sortable: false },
  { title: "Pts",  key: "pts",    sortable: false },
];

// ─── score helpers ────────────────────────────────────────────────────────────

function parseScores(m) {
  if (!m.scores_csv) return [null, null];
  const parts = m.scores_csv.split(",").map((s) => s.split("-").map(Number));
  const s1 = parts.reduce((a, p) => a + (p[0] ?? 0), 0);
  const s2 = parts.reduce((a, p) => a + (p[1] ?? 0), 0);
  return [s1, s2];
}
const scoreP1 = (m) => parseScores(m)[0] ?? "-";
const scoreP2 = (m) => parseScores(m)[1] ?? "-";
const matchChipColor = (m, side) => {
  if (!m.winner_id) return "default";
  const pid = side === 1 ? m.player1_id : m.player2_id;
  return m.winner_id === pid ? "success" : "error";
};
</script>

<style scoped>
.bracket-scroll {
  overflow-x: auto;
  padding-bottom: 8px;
}
.bracket-grid {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  min-width: max-content;
}
.bracket-round {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}
.round-label {
  text-align: center;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 11px;
}
.border-b {
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.border-b:last-child {
  border-bottom: none;
}
</style>
