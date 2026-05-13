<template>
  <div :id="containerId" class="brackets-viewer" />
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
// Side-effect import — sets window.bracketsViewer singleton
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
.brackets-viewer {
  --primary-background:   #1E2530;
  --secondary-background: #151B23;
  --match-background:     #1E2530;
  --font-family:          inherit;
  --text-color:           #e2e8f0;
  --hint-color:           #9ca3af;
  --win-color:            #10b981;
  --loss-color:           #ef4444;
  --border-color:         rgba(255, 255, 255, 0.1);
  --connector-color:      rgba(255, 255, 255, 0.15);
  overflow-x: auto;
}
</style>
