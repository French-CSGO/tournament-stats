<template>
  <div :class="'card ' + cls">
    <div class="rank-big">{{ String(rank).padStart(2, "0") }}</div>
    <div style="position:relative;z-index:1">
      <div class="team-label">{{ player.team }}</div>
      <div class="handle">{{ player.name }}</div>
    </div>
    <div class="stats-row" style="position:relative;z-index:1">
      <div class="stat">
        <div class="k">RATING</div>
        <div class="v">{{ Number(player.rating).toFixed(2) }}</div>
      </div>
      <div class="stat">
        <div class="k">K/D</div>
        <div class="v">{{ Number(player.kd).toFixed(2) }}</div>
      </div>
      <div class="stat">
        <div class="k">ADR</div>
        <div class="v">{{ Number(player.adr).toFixed(0) }}</div>
      </div>
      <div class="stat">
        <div class="k">HS</div>
        <div class="v">{{ player.hs }}<span style="font-size:14px">%</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rank:   { type: Number, required: true },
  player: { type: Object, required: true },
  cls:    { type: String, default: "" },
});
</script>
