<template>
  <div class="round-timeline">
    <div class="text-caption text-medium-emphasis font-weight-medium mb-2">ROUND HISTORY</div>

    <div v-if="!rounds.length" class="text-caption text-medium-emphasis">
      Aucune donnée de rounds disponible.
    </div>

    <div v-else class="rounds-row">
      <template v-for="(round, i) in rounds" :key="round.round_num">
        <!-- Halftime separator after round 12 -->
        <div v-if="i > 0 && round.round_num === 13" class="halftime-sep" />

        <v-tooltip location="bottom" :open-delay="80">
          <template #activator="{ props: tip }">
            <div
              class="round-box"
              :class="roundClass(round)"
              v-bind="tip"
            >
              {{ round.round_num }}
            </div>
          </template>

          <div class="round-tooltip">
            <div class="tooltip-header">
              Round {{ round.round_num }}
              <span class="tooltip-score">{{ round.t1_score_after }} : {{ round.t2_score_after }}</span>
            </div>

            <template v-if="kills(round).length">
              <div v-for="(k, ki) in kills(round)" :key="ki" class="kill-line">
                <span class="killer">{{ k.killer_name }}</span>
                <v-icon
                  size="x-small"
                  class="mx-1"
                  :color="k.headshot ? 'yellow-darken-2' : 'grey-lighten-1'"
                >{{ k.headshot ? 'mdi-head-flash' : 'mdi-skull' }}</v-icon>
                <span class="victim">{{ k.victim_name }}</span>
                <span v-if="k.weapon" class="weapon ml-1">({{ k.weapon }})</span>
              </div>
            </template>
            <div v-else class="text-caption" style="opacity:.6">Pas de détail de kills.</div>
          </div>
        </v-tooltip>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rounds:   { type: Array,  default: () => [] },
  team1Id:  { type: Number, default: null },
  team2Id:  { type: Number, default: null }
});

function roundClass(round) {
  if (round.winner_team_id === props.team1Id) return "round-t1";
  if (round.winner_team_id === props.team2Id) return "round-t2";
  return "round-unknown";
}

function kills(round) {
  if (!round.kills) return [];
  try {
    return typeof round.kills === "string" ? JSON.parse(round.kills) : round.kills;
  } catch {
    return [];
  }
}
</script>

<style scoped>
.round-timeline { padding: 4px 0; }

.rounds-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.round-box {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  cursor: default;
  user-select: none;
  transition: transform 0.12s;
}
.round-box:hover { transform: scale(1.18); z-index: 1; }

.round-t1      { background-color: #e8a020; color: #fff; }
.round-t2      { background-color: #5b4fcf; color: #fff; }
.round-unknown { background-color: #444;    color: #999; }

.halftime-sep {
  width: 2px;
  height: 28px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  flex-shrink: 0;
}

.round-tooltip { min-width: 200px; max-width: 320px; }
.tooltip-header {
  font-weight: 700;
  margin-bottom: 6px;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tooltip-score { font-family: monospace; color: #ffd166; }

.kill-line {
  font-size: 12px;
  line-height: 1.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.killer { font-weight: 600; }
.victim { opacity: 0.7; }
.weapon { opacity: 0.55; font-size: 11px; }
</style>
