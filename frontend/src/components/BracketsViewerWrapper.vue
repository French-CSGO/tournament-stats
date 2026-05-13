<template>
  <div ref="container" class="brackets-viewer" />
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { BracketsViewer } from "brackets-viewer";
import "brackets-viewer/dist/brackets-viewer.min.css";

const props = defineProps({
  data: { type: Object, required: true },
});

const container = ref(null);
let viewer = null;

async function render() {
  if (!container.value || !props.data) return;
  if (!viewer) viewer = new BracketsViewer();
  container.value.innerHTML = "";
  await viewer.render(props.data, {
    selector:                     `#${container.value.id}`,
    participantOriginPlacement:   "none",
    showSlotsOrigin:              false,
    showLowerBracketSlotsOrigin:  false,
    highlightParticipantOnHover:  true,
    showRankingTable:             true,
    clear:                        true,
  });
}

onMounted(() => {
  // give the element a unique id so the selector works
  container.value.id = `bv-${Math.random().toString(36).slice(2)}`;
  render();
});

watch(() => props.data, render, { deep: true });
</script>

<style>
/* Override brackets-viewer dark theme to match our surface color */
.brackets-viewer {
  --primary-background:       #1E2530;
  --secondary-background:     #151B23;
  --match-background:         #1E2530;
  --font-family:              inherit;
  --text-color:               #e2e8f0;
  --hint-color:               #9ca3af;
  --win-color:                #10b981;
  --loss-color:               #ef4444;
  --border-color:             rgba(255,255,255,0.1);
  --connector-color:          rgba(255,255,255,0.15);
  overflow-x: auto;
}
</style>
