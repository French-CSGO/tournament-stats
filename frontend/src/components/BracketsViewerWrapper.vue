<template>
  <div :id="containerId" class="brackets-viewer" />
</template>

<script setup>
import { onMounted, watch } from "vue";
import "brackets-viewer";
import "brackets-viewer/dist/brackets-viewer.min.css";

const props = defineProps({
  data: { type: Object, required: true },
});

const containerId = `bv-${Math.random().toString(36).slice(2)}`;

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

/* Round Robin: matches in 2-row columns (N matches → ceil(N/2) cols × 2 rows) */
.brackets-viewer .round-robin section.group,
.brackets-viewer .round-robin article.round {
  overflow: visible !important;
}

.brackets-viewer .round-robin article.round {
  position: relative !important;
  display: grid !important;
  grid-template-rows: auto auto !important;
  grid-auto-flow: column !important;
  grid-auto-columns: var(--match-width) !important;
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
