<template>
  <div class="bracket-match">
    <!-- Participant 1 -->
    <div class="bracket-slot" :class="slotClass(match.player1_id)">
      <span class="seed text-caption text-medium-emphasis">{{ seed(match.player1_id) }}</span>
      <span class="name text-body-2" :class="{ 'font-weight-bold': isWinner(match.player1_id) }">
        {{ name(match.player1_id) }}
      </span>
      <span class="score text-body-2 font-weight-bold" :class="scoreClass(match.player1_id)">
        {{ score(1) }}
      </span>
    </div>

    <!-- Separator -->
    <div class="bracket-sep" />

    <!-- Participant 2 -->
    <div class="bracket-slot" :class="slotClass(match.player2_id)">
      <span class="seed text-caption text-medium-emphasis">{{ seed(match.player2_id) }}</span>
      <span class="name text-body-2" :class="{ 'font-weight-bold': isWinner(match.player2_id) }">
        {{ name(match.player2_id) }}
      </span>
      <span class="score text-body-2 font-weight-bold" :class="scoreClass(match.player2_id)">
        {{ score(2) }}
      </span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  match:        { type: Object, required: true },
  participants: { type: Object, required: true },
});

const name = (id) => {
  if (!id) return "TBD";
  return props.participants[id]?.name ?? "?";
};

const seed = (id) => {
  if (!id) return "";
  return props.participants[id]?.seed ?? "";
};

const isWinner = (id) => id && props.match.winner_id === id;

const slotClass = (id) => {
  if (!props.match.winner_id) return "";
  return isWinner(id) ? "slot-winner" : "slot-loser";
};

const scoreClass = (id) => {
  if (!props.match.winner_id) return "";
  return isWinner(id) ? "text-success" : "text-error";
};

function parseScores() {
  if (!props.match.scores_csv) return [null, null];
  const parts = props.match.scores_csv.split(",").map((s) => s.split("-").map(Number));
  const s1 = parts.reduce((a, p) => a + (p[0] ?? 0), 0);
  const s2 = parts.reduce((a, p) => a + (p[1] ?? 0), 0);
  return [s1, s2];
}

const score = (side) => {
  const [s1, s2] = parseScores();
  if (s1 === null) return props.match.state === "open" ? "" : "-";
  return side === 1 ? s1 : s2;
};
</script>

<style scoped>
.bracket-match {
  background: #1E2530;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  overflow: hidden;
  width: 200px;
}
.bracket-slot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
}
.bracket-slot.slot-loser .name {
  opacity: 0.45;
}
.bracket-sep {
  height: 1px;
  background: rgba(255,255,255,0.08);
}
.seed {
  min-width: 16px;
  text-align: right;
  flex-shrink: 0;
}
.name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.score {
  flex-shrink: 0;
  min-width: 20px;
  text-align: right;
}
</style>
