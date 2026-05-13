<template>
  <div>
    <div :id="containerId" class="brackets-viewer" />

    <v-dialog v-model="dialog" max-width="360">
      <v-card color="surface" rounded="lg">
        <v-card-title class="text-body-1 pt-4 pb-2 px-4">
          Détails du match
        </v-card-title>
        <v-card-text class="px-4 pb-3">
          <div v-if="matchLoading" class="text-center py-4">
            <v-progress-circular indeterminate size="28" />
          </div>
          <div v-else-if="matchData" class="d-flex align-center justify-center gap-3">
            <span :class="matchData.winner_id === null ? '' : (matchData.team1_score > matchData.team2_score ? 'font-weight-bold' : 'text-medium-emphasis')" class="text-body-2 text-right" style="flex:1">
              {{ matchData.team1_name }}
            </span>
            <div class="d-flex align-center gap-1">
              <v-chip size="small" :color="matchData.team1_score > matchData.team2_score ? 'success' : 'default'" variant="flat">
                {{ matchData.team1_score }}
              </v-chip>
              <span class="text-caption text-medium-emphasis">–</span>
              <v-chip size="small" :color="matchData.team2_score > matchData.team1_score ? 'success' : 'default'" variant="flat">
                {{ matchData.team2_score }}
              </v-chip>
            </div>
            <span :class="matchData.winner_id === null ? '' : (matchData.team2_score > matchData.team1_score ? 'font-weight-bold' : 'text-medium-emphasis')" class="text-body-2 text-left" style="flex:1">
              {{ matchData.team2_name }}
            </span>
          </div>
          <div v-else class="text-caption text-medium-emphasis text-center py-2">
            Aucun match G5 lié à ce match Challonge.
          </div>
        </v-card-text>
        <v-card-actions v-if="matchData" class="px-4 pb-4 pt-0">
          <v-spacer />
          <v-btn
            :to="`/match/${matchData.id}`"
            variant="tonal"
            size="small"
            prepend-icon="mdi-chart-bar"
            @click="dialog = false"
          >Voir le match</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from "vue";
import "brackets-viewer";
import "brackets-viewer/dist/brackets-viewer.min.css";

const props = defineProps({
  data: { type: Object, required: true },
});

const containerId = `bv-${Math.random().toString(36).slice(2)}`;

const dialog      = ref(false);
const matchLoading = ref(false);
const matchData   = ref(null);

async function openMatch(challongeId) {
  dialog.value = true;
  matchLoading.value = true;
  matchData.value = null;
  try {
    const res = await fetch(`/api/matches/challonge/${challongeId}`);
    matchData.value = res.ok ? await res.json() : null;
  } catch {
    matchData.value = null;
  }
  matchLoading.value = false;
}

function attachClickListeners() {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll(".match[data-match-id]").forEach((el) => {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => openMatch(el.dataset.matchId), { once: false });
  });
}

async function render() {
  if (!props.data) return;
  await window.bracketsViewer.render(props.data, {
    selector:                    `#${containerId}`,
    participantOriginPlacement:  "none",
    showSlotsOrigin:             false,
    showLowerBracketSlotsOrigin: false,
    highlightParticipantOnHover: true,
    showRankingTable:            true,
    clear:                       true,
  });
  attachClickListeners();
}

onMounted(render);
watch(() => props.data, render, { deep: true });
</script>

<style>
/* Override brackets-viewer default (white) theme with our dark palette */
.brackets-viewer {
  --primary-background:    #1E2530;
  --secondary-background:  #151B23;
  --match-background:      #252e3d;
  --font-color:            #e2e8f0;
  --win-color:             #10b981;
  --loss-color:            #ef4444;
  --label-color:           #9ca3af;
  --hint-color:            #64748b;
  --connector-color:       rgba(255, 255, 255, 0.2);
  --border-color:          rgba(255, 255, 255, 0.12);
  --border-hover-color:    rgba(255, 255, 255, 0.28);
  --border-selected-color: #00BCD4;
  --text-size:             13px;
  --match-width:           180px;
  overflow-x: auto;
}

/* Background of the whole container */
.brackets-viewer {
  background: transparent !important;
}

/* Match cards */
.brackets-viewer .opponents {
  background: var(--match-background) !important;
  border-color: var(--border-color) !important;
}
.brackets-viewer .opponents:hover {
  border-color: var(--border-hover-color) !important;
}

/* Participant rows */
.brackets-viewer .participant {
  color: var(--font-color) !important;
}
.brackets-viewer .participant.win .name {
  color: var(--font-color) !important;
  font-weight: 600;
}
.brackets-viewer .participant.loss .name {
  color: var(--hint-color) !important;
}

/* Result score */
.brackets-viewer .participant .result {
  font-weight: 700;
}

/* Round headers */
.brackets-viewer .round-name {
  color: #9ca3af !important;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Ranking table (round robin) */
.brackets-viewer table {
  background: var(--secondary-background) !important;
  color: var(--font-color) !important;
  border-color: var(--border-color) !important;
}
.brackets-viewer table th {
  background: #1a2130 !important;
  color: #9ca3af !important;
  border-color: var(--border-color) !important;
}
.brackets-viewer table td {
  border-color: var(--border-color) !important;
  color: var(--font-color) !important;
}
.brackets-viewer table tr:hover td {
  background: rgba(255, 255, 255, 0.04) !important;
}

/* Connectors */
.brackets-viewer .connector {
  border-color: var(--connector-color) !important;
}

/* Round Robin: ranking table above rounds */
.brackets-viewer .round-robin section.group {
  display: flex !important;
  flex-direction: column !important;
  overflow: visible !important;
}
.brackets-viewer .round-robin section.group > h2   { order: -3 !important; }
.brackets-viewer .round-robin section.group > table { order: -2 !important; margin-bottom: 20px !important; }
.brackets-viewer .round-robin section.group > article.round { order: 0 !important; }

/* Round Robin: matches in 2-row columns (N matches → ceil(N/2) cols × 2 rows) */
.brackets-viewer .round-robin article.round {
  overflow: visible !important;
}

.brackets-viewer .round-robin article.round {
  position: relative !important;
  display: grid !important;
  grid-template-rows: auto auto !important;
  grid-auto-flow: column !important;
  grid-auto-columns: var(--match-width) !important;
  width: 100% !important;
  gap: 6px !important;
  padding-top: 26px !important;
  margin-bottom: 20px !important;
}

.brackets-viewer .round-robin article.round > h3 {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  margin: 0 !important;
  color: #9ca3af !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}
</style>
