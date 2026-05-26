<template>
  <div v-if="!rounds.length" style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:0.14em">
    AUCUNE DONNÉE DE ROUNDS.
  </div>
  <div v-else>
    <div class="timeline">
      <!-- Score track -->
      <div class="score-track">
        <span class="a" :class="{ win: finalA > finalB }">
          <span class="tag-mini">{{ team1Tag }}</span>
          <span class="v">{{ finalA }}</span>
        </span>
        <div class="track">
          <div class="fill-a" :style="{ width: finalA + finalB > 0 ? (finalA / (finalA + finalB) * 100) + '%' : '50%' }" />
          <div class="fill-b" :style="{ width: finalA + finalB > 0 ? (finalB / (finalA + finalB) * 100) + '%' : '50%' }" />
        </div>
        <span class="b" :class="{ win: finalB > finalA }">
          <span class="v">{{ finalB }}</span>
          <span class="tag-mini">{{ team2Tag }}</span>
        </span>
      </div>

      <!-- Half labels -->
      <div style="display:flex;gap:0;margin-bottom:8px;font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;color:var(--ink-3)">
        <div style="flex:1;padding:6px 0;border-top:2px solid var(--ct)">
          <span style="color:var(--ct)">HALF 1</span> · ROUNDS 1–12
        </div>
        <div style="width:2px" />
        <div style="flex:1;padding:6px 0;border-top:2px solid var(--t);text-align:right">
          ROUNDS 13+ · <span style="color:var(--t)">HALF 2</span>
        </div>
      </div>

      <!-- Round bars -->
      <div class="axis">
        <template v-for="(r, i) in rounds" :key="r.round_num">
          <div v-if="i === 12" class="half-divider" />
          <div
            v-else-if="i > 12 && r.round_num >= 25 && (r.round_num - 25) % 6 === 0"
            class="half-divider"
          />
          <div
            class="round-cell"
            @mouseenter="hoverRound = r; hoverIdx = i; updatePos($event)"
            @mouseleave="hoverRound = null"
            @mousemove="updatePos"
          >
            <div class="num">{{ r.round_num }}</div>
            <div :class="'bar ' + winClass(r)">
              <div :class="'side-strip ' + sideClass(r)" />
              <span class="reason-icon">{{ reasonGlyph(r.reason) }}</span>
            </div>
          </div>
        </template>
      </div>

      <div class="legend">
        <span><span class="swatch" style="background:var(--ct)" />CT WIN</span>
        <span><span class="swatch" style="background:var(--t)" />T WIN</span>
        <span><span class="swatch" style="background:var(--accent)" />{{ team1Tag }} WIN (CT start)</span>
        <span><span class="swatch" style="background:var(--ink-2)" />{{ team2Tag }} WIN</span>
        <span style="margin-left:auto">K · KILLS &nbsp; X · BOMB &nbsp; D · DEFUSE &nbsp; T · TIME</span>
      </div>
    </div>

    <!-- Running score grid -->
    <div
      style="margin-top:32px;display:grid;gap:2px;font-family:var(--font-mono);font-size:9px;color:var(--ink-3)"
      :style="{ gridTemplateColumns: `repeat(${rounds.length}, 1fr)` }"
    >
      <div
        v-for="(r, i) in rounds"
        :key="r.round_num"
        style="text-align:center;padding:4px 0;border-top:1px solid var(--line)"
      >
        <div :style="{ color: t1WonRound(i) ? 'var(--accent)' : 'var(--ink-3)' }">
          {{ r.t1_score_after ?? 0 }}
        </div>
        <div :style="{ color: t2WonRound(i) ? 'var(--accent)' : 'var(--ink-3)' }">
          {{ r.t2_score_after ?? 0 }}
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <div
        v-if="hoverRound"
        class="bcast-tooltip"
        :style="tooltipStyle"
      >
        <div class="tt-head">
          <span class="rn">R/{{ String(hoverRound.round_num).padStart(2, "0") }}</span>
          <span
            style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em"
            :style="{ color: hoverRound.winner_side === 'CT' ? 'var(--ct)' : 'var(--t)' }"
          >
            {{ hoverRound.winner_side }} WIN
          </span>
          <span class="winner">
            {{ hoverRound.t1_score_after ?? 0 }} : {{ hoverRound.t2_score_after ?? 0 }}
          </span>
        </div>
        <div class="tt-reason">{{ formatReason(hoverRound.reason) }}</div>
        <div class="tt-kills">
          <div
            v-for="(k, ki) in parseKills(hoverRound)"
            :key="ki"
            class="tt-kill"
          >
            <span class="t"></span>
            <span class="killer">{{ k.killer_name }}</span>
            <span style="color:var(--ink-4);text-align:center">→</span>
            <span class="victim">{{ k.victim_name }}</span>
            <span class="hs">{{ k.headshot ? "HS" : "" }}</span>
          </div>
        </div>
        <div
          style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-size:9px;color:var(--ink-4);letter-spacing:0.12em;display:flex;justify-content:space-between"
        >
          <span>{{ parseKills(hoverRound).length }} KILLS</span>
          <span>{{ parseKills(hoverRound).filter(k => k.headshot).length }} HS</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { getTeamTag, formatReason, reasonGlyph } from "../utils/mapData.js";

const props = defineProps({
  rounds:    { type: Array, default: () => [] },
  team1Name: { type: String, default: "" },
  team2Name: { type: String, default: "" },
});

const hoverRound = ref(null);
const hoverIdx   = ref(-1);
const mousePos   = ref({ x: 0, y: 0 });

const team1Tag = computed(() => getTeamTag(props.team1Name));
const team2Tag = computed(() => getTeamTag(props.team2Name));

function updatePos(e) {
  mousePos.value = { x: e.clientX, y: e.clientY };
}

const tooltipStyle = computed(() => {
  const w = 320, h = 200 + parseKills(hoverRound.value).length * 22;
  let left = mousePos.value.x + 18;
  let top  = mousePos.value.y + 18;
  if (left + w > window.innerWidth)  left = mousePos.value.x - w - 18;
  if (top  + h > window.innerHeight) top  = mousePos.value.y - h - 18;
  return { left: left + "px", top: top + "px", width: w + "px" };
});

function winClass(r) {
  return r.winner_side === "CT" ? "a-win" : "b-win";
}
function sideClass(r) {
  return r.winner_side === "CT" ? "ct" : "t";
}

function t1WonRound(i) {
  const curr = props.rounds[i]?.t1_score_after ?? 0;
  const prev = i > 0 ? (props.rounds[i - 1]?.t1_score_after ?? 0) : 0;
  return curr > prev;
}
function t2WonRound(i) {
  const curr = props.rounds[i]?.t2_score_after ?? 0;
  const prev = i > 0 ? (props.rounds[i - 1]?.t2_score_after ?? 0) : 0;
  return curr > prev;
}

const finalA = computed(() => props.rounds[props.rounds.length - 1]?.t1_score_after ?? 0);
const finalB = computed(() => props.rounds[props.rounds.length - 1]?.t2_score_after ?? 0);

function parseKills(round) {
  if (!round?.kills) return [];
  try {
    return typeof round.kills === "string" ? JSON.parse(round.kills) : (round.kills || []);
  } catch {
    return [];
  }
}
</script>
