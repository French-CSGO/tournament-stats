<template>
  <div>
    <!-- Map background hero banner -->
    <div style="position:relative;height:220px;border-bottom:1px solid var(--line);overflow:hidden">
      <div
        class="map-bg-full"
        :style="{ '--h': getMapHue(map.map_name) }"
      />
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,11,0.4) 0%,rgba(10,10,11,0.95) 100%)" />
      <div style="position:absolute;inset:0;padding:32px var(--pad-x);display:flex;flex-direction:column;justify-content:space-between">
        <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;color:var(--ink-2);display:flex;gap:16px">
          <span>MAP {{ mapIdx + 1 }} OF {{ mapCount }}</span>
          <span>·</span>
          <span>{{ map.map_name }}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end">
          <div>
            <div style="font-family:var(--font-display);font-size:clamp(56px,9vw,140px);font-weight:600;letter-spacing:0.01em;text-transform:uppercase;line-height:0.9">
              {{ getMapName(map.map_name) }}
            </div>
          </div>
          <div style="display:flex;gap:32px;align-items:flex-end;font-family:var(--font-display)">
            <div style="text-align:center">
              <div style="font-size:11px;font-family:var(--font-mono);color:var(--ink-3);letter-spacing:0.12em">{{ teamTag(match.team1_name) }}</div>
              <div style="font-size:96px;font-weight:600;line-height:1" :style="{ color: map.team1_score > map.team2_score ? 'var(--accent)' : 'var(--ink)' }">{{ map.team1_score }}</div>
            </div>
            <div style="font-size:56px;color:var(--ink-4);margin-bottom:12px">—</div>
            <div style="text-align:center">
              <div style="font-size:11px;font-family:var(--font-mono);color:var(--ink-3);letter-spacing:0.12em">{{ teamTag(match.team2_name) }}</div>
              <div style="font-size:96px;font-weight:600;line-height:1" :style="{ color: map.team2_score > map.team1_score ? 'var(--accent)' : 'var(--ink)' }">{{ map.team2_score }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi">
        <div class="k">Total Kills</div>
        <div class="v">{{ totalKills }}</div>
      </div>
      <div class="kpi">
        <div class="k">Headshot %</div>
        <div class="v accent">{{ hsPct }}<small style="font-size:16px;color:var(--ink-3)">%</small></div>
      </div>
      <div class="kpi">
        <div class="k">Rounds</div>
        <div class="v">{{ map.team1_score + map.team2_score }}</div>
      </div>
      <div class="kpi">
        <div class="k">ADR Moy.</div>
        <div class="v">{{ avgAdr }}</div>
      </div>
    </div>

    <!-- SCOREBOARD -->
    <section class="section">
      <div class="section-head">
        <h2>Scoreboard</h2>
        <div class="right">
          <span class="index">— PG. 03</span>
          <span>·</span>
          <span>{{ map.players?.length || 0 }} JOUEURS</span>
        </div>
      </div>
      <TeamScoreboard
        :team-name="match.team1_name"
        :players="team1Players"
      />
      <div style="height:32px" />
      <TeamScoreboard
        :team-name="match.team2_name"
        :players="team2Players"
      />
    </section>

    <!-- ROUND TIMELINE -->
    <section class="section">
      <div class="section-head">
        <h2>Round-by-Round</h2>
        <div class="right">
          <span class="index">— PG. 04</span>
          <span v-if="!roundsLoading">·</span>
          <span v-if="!roundsLoading">{{ rounds.length }} ROUNDS · HOVER FOR KILLS</span>
        </div>
      </div>
      <div v-if="roundsLoading" style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:0.14em">
        CHARGEMENT…
      </div>
      <BroadcastTimeline
        v-else
        :rounds="rounds"
        :team1-name="match.team1_name"
        :team2-name="match.team2_name"
      />
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getTeamColor, getTeamTag, getMapName, getMapHue, ratingClass } from "../utils/mapData.js";
import TeamScoreboard from "./TeamScoreboard.vue";
import BroadcastTimeline from "./BroadcastTimeline.vue";

const props = defineProps({
  map:           { type: Object, required: true },
  mapIdx:        { type: Number, default: 0 },
  mapCount:      { type: Number, default: 1 },
  match:         { type: Object, required: true },
  rounds:        { type: Array, default: () => [] },
  roundsLoading: { type: Boolean, default: false },
});

const teamTag = getTeamTag;

const team1Players = computed(() =>
  (props.map.players || []).filter(p => p.team_name === props.match.team1_name)
);
const team2Players = computed(() =>
  (props.map.players || []).filter(p => p.team_name === props.match.team2_name)
);

const totalKills = computed(() =>
  (props.map.players || []).reduce((s, p) => s + (parseInt(p.kills) || 0), 0)
);
const hsPct = computed(() => {
  const kills = (props.map.players || []).reduce((s, p) => s + (parseInt(p.kills) || 0), 0);
  const hs = (props.map.players || []).reduce((s, p) => s + (parseInt(p.headshot_kills) || 0), 0);
  return kills > 0 ? Math.round(hs / kills * 100) : 0;
});
const avgAdr = computed(() => {
  const players = props.map.players || [];
  if (!players.length) return 0;
  const total = players.reduce((s, p) => {
    const rounds = parseInt(p.roundsplayed) || 1;
    return s + (parseInt(p.damage) || 0) / rounds;
  }, 0);
  return (total / players.length).toFixed(1);
});
</script>

<style scoped>
.map-bg-full {
  position: absolute; inset: 0;
  background:
    radial-gradient(120% 80% at 20% 110%, hsla(var(--h),60%,55%,0.7), transparent 60%),
    radial-gradient(100% 80% at 90% 10%, hsla(var(--h),80%,40%,0.55), transparent 50%),
    linear-gradient(135deg, hsl(var(--h), 45%, 22%) 0%, hsl(var(--h), 35%, 12%) 70%);
}
.map-bg-full::after {
  content: ""; position: absolute; inset: 0;
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 22px),
    repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 18px);
  mix-blend-mode: overlay;
}
</style>
