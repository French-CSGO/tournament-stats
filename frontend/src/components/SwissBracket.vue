<template>
  <div class="swiss-wrap">
    <div class="swiss-bracket">
      <div v-for="(col, ci) in columns" :key="ci" class="swiss-col">
        <div class="swiss-col-header">Round {{ ci + 1 }}</div>
        <div v-for="group in col" :key="group.record" class="swiss-group">
          <div class="swiss-group-label">{{ group.record }}</div>
          <div
            v-for="m in group.matches"
            :key="m.id"
            class="swiss-match"
            @click="openMatch(m.id)"
          >
            <div class="swiss-side" :class="sideClass(m, 1)">
              <span class="swiss-team">{{ pMap[m.player1_id]?.name ?? '?' }}</span>
              <span class="swiss-score" :class="scoreClass(m, 1)">{{ scoreOf(m, 0) }}</span>
            </div>
            <div class="swiss-divider" />
            <div class="swiss-side" :class="sideClass(m, 2)">
              <span class="swiss-team">{{ pMap[m.player2_id]?.name ?? '?' }}</span>
              <span class="swiss-score" :class="scoreClass(m, 2)">{{ scoreOf(m, 1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- G5 match popup -->
    <v-dialog v-model="dialog" max-width="360">
      <v-card color="surface" rounded="lg">
        <v-card-title class="text-body-1 pt-4 pb-2 px-4">Détails du match</v-card-title>
        <v-card-text class="px-4 pb-3">
          <div v-if="matchLoading" class="text-center py-4">
            <v-progress-circular indeterminate size="28" />
          </div>
          <div v-else-if="matchData" class="d-flex align-center justify-center gap-3">
            <span :class="matchData.team1_score > matchData.team2_score ? 'font-weight-bold' : 'text-medium-emphasis'" class="text-body-2 text-right" style="flex:1">
              {{ matchData.team1_name }}
            </span>
            <div class="d-flex align-center gap-1">
              <v-chip size="small" :color="matchData.team1_score > matchData.team2_score ? 'success' : 'default'" variant="flat">{{ matchData.team1_score }}</v-chip>
              <span class="text-caption text-medium-emphasis">–</span>
              <v-chip size="small" :color="matchData.team2_score > matchData.team1_score ? 'success' : 'default'" variant="flat">{{ matchData.team2_score }}</v-chip>
            </div>
            <span :class="matchData.team2_score > matchData.team1_score ? 'font-weight-bold' : 'text-medium-emphasis'" class="text-body-2" style="flex:1">
              {{ matchData.team2_name }}
            </span>
          </div>
          <div v-else class="text-caption text-medium-emphasis text-center py-2">
            Aucun match G5 lié à ce match Challonge.
          </div>
        </v-card-text>
        <v-card-actions v-if="matchData" class="px-4 pb-4 pt-0">
          <v-spacer />
          <v-btn :to="`/match/${matchData.id}`" variant="tonal" size="small" prepend-icon="mdi-chart-bar" @click="dialog = false">
            Voir le match
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  matches:      { type: Array, required: true },
  participants: { type: Array, required: true },
});

const pMap = computed(() =>
  Object.fromEntries(props.participants.map((p) => [p.id, p]))
);

// ─── record-based column layout ───────────────────────────────────────────────

const columns = computed(() => {
  const played = props.matches.filter((m) => m.player1_id || m.player2_id);

  // Group by round (positive rounds only — Swiss uses 1-based positive rounds)
  const byRound = {};
  for (const m of played) {
    if (m.round < 1) continue;
    (byRound[m.round] ??= []).push(m);
  }

  const rounds = Object.keys(byRound).map(Number).sort((a, b) => a - b);
  if (!rounds.length) return [];

  // Track running W-L record per participant
  const rec = {};
  for (const p of props.participants) rec[p.id] = { w: 0, l: 0 };

  const result = [];

  for (const r of rounds) {
    const rMatches = byRound[r];

    // Group matches by the current record of their participants
    const groups = {};
    for (const m of rMatches) {
      const { w, l } = rec[m.player1_id] ?? { w: 0, l: 0 };
      const key = `${w}-${l}`;
      (groups[key] ??= []).push(m);
    }

    // Sort groups: most wins first, then fewest losses
    const sorted = Object.entries(groups)
      .sort(([a], [b]) => {
        const [aw, al] = a.split("-").map(Number);
        const [bw, bl] = b.split("-").map(Number);
        return bw - aw || al - bl;
      })
      .map(([record, matches]) => ({ record, matches }));

    result.push(sorted);

    // Update records from this round's results
    for (const m of rMatches) {
      if (!m.winner_id) continue;
      const loser = m.player1_id === m.winner_id ? m.player2_id : m.player1_id;
      if (m.winner_id) { if (!rec[m.winner_id]) rec[m.winner_id] = { w: 0, l: 0 }; rec[m.winner_id].w++; }
      if (loser)       { if (!rec[loser])       rec[loser]       = { w: 0, l: 0 }; rec[loser].l++;       }
    }
  }

  return result;
});

// ─── score / style helpers ────────────────────────────────────────────────────

function scoreOf(m, side) {
  if (!m.scores_csv) return "-";
  const parts = m.scores_csv.split(",").map((s) => s.split("-").map(Number));
  return parts.reduce((acc, p) => acc + (p[side] ?? 0), 0);
}

function sideClass(m, side) {
  if (!m.winner_id) return "";
  return m.winner_id === (side === 1 ? m.player1_id : m.player2_id) ? "win" : "lose";
}

function scoreClass(m, side) {
  if (!m.winner_id) return "";
  return m.winner_id === (side === 1 ? m.player1_id : m.player2_id) ? "score-win" : "score-lose";
}

// ─── G5 match popup ───────────────────────────────────────────────────────────

const dialog      = ref(false);
const matchLoading = ref(false);
const matchData   = ref(null);

async function openMatch(challongeId) {
  dialog.value      = true;
  matchLoading.value = true;
  matchData.value   = null;
  try {
    const res = await fetch(`/api/matches/challonge/${challongeId}`);
    matchData.value = res.ok ? await res.json() : null;
  } catch { matchData.value = null; }
  matchLoading.value = false;
}
</script>

<style scoped>
.swiss-wrap {
  overflow-x: auto;
  padding-bottom: 4px;
}

.swiss-bracket {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  min-width: max-content;
}

.swiss-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 200px;
  flex-shrink: 0;
}

.swiss-col-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  padding: 5px 8px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
}

.swiss-group {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 7px;
  overflow: hidden;
}

.swiss-group-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.06);
  padding: 4px 10px;
  text-align: center;
}

.swiss-match {
  background: #252e3d;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: background 0.12s;
}
.swiss-match:hover { background: #2d3848; }

.swiss-side {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
}
.swiss-side.win  .swiss-team { font-weight: 600; color: #e2e8f0; }
.swiss-side.lose .swiss-team { color: #4b5563; }

.swiss-team {
  flex: 1;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.swiss-score {
  font-size: 12px;
  font-weight: 700;
  min-width: 18px;
  text-align: right;
  flex-shrink: 0;
  color: #64748b;
}
.score-win  { color: #10b981; }
.score-lose { color: #ef4444; }

.swiss-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0 8px;
}
</style>
