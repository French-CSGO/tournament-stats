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
        <!-- OT separator every 6 rounds starting at 25 -->
        <div v-else-if="i > 0 && round.round_num > 24 && (round.round_num - 25) % 6 === 0" class="halftime-sep ot-sep" />

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

            <div v-if="round.winner_side" class="tooltip-winner mb-1">
              <span :class="round.winner_side === 'CT' ? 'side-ct' : 'side-t'">
                {{ round.winner_side }}
              </span>
              <span v-if="round.reason" class="tooltip-reason ml-1">— {{ formatReason(round.reason) }}</span>
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

// Color box by winning side (CT = blue, T = orange), not by team
function roundClass(round) {
  if (round.winner_side === "CT") return "round-ct";
  if (round.winner_side === "T")  return "round-t";
  return "round-unknown";
}

const REASON_LABELS = {
  target_bombed:          "Bomb",
  bomb_defused:           "Defuse",
  ct_win:                 "CT Win",
  t_win:                  "T Win",
  target_saved:           "Save",
  draw:                   "Draw",
  hostages_rescued:       "Rescue",
  hostages_not_rescued:   "No Rescue",
  terrorists_escaped:     "Escape",
  cts_prevent_escape:     "Prevent",
  terrorists_neutralized: "Neutralized",
  terrorists_not_escaped: "No Escape",
  t_surrender:            "T Surrender",
  ct_surrender:           "CT Surrender",
  game_commencing:        "Game Start",
  t_planted:              "Planted",
  cts_reached_hostage:    "Reached Hostage",
  survival_win:           "Survival Win",
  survival_draw:          "Survival Draw",
  unknown:                "Unknown",
};

function formatReason(reason) {
  return REASON_LABELS[reason] ?? reason.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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

.round-ct      { background-color: #2979b0; color: #fff; }
.round-t       { background-color: #e8a020; color: #fff; }
.round-unknown { background-color: #444;    color: #999; }

.halftime-sep {
  width: 2px;
  height: 28px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  flex-shrink: 0;
}
.ot-sep { background: rgba(255,255,255,0.08); }

.round-tooltip { min-width: 200px; max-width: 320px; }
.tooltip-header {
  font-weight: 700;
  margin-bottom: 4px;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tooltip-score  { font-family: monospace; color: #ffd166; }
.tooltip-winner { font-size: 12px; }
.tooltip-reason { opacity: 0.75; }

.side-ct { color: #5aabff; font-weight: 700; }
.side-t  { color: #ffaa33; font-weight: 700; }

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
