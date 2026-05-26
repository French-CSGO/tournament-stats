<template>
  <div v-if="loading" class="section">
    <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;color:var(--ink-3)">
      CHARGEMENT…
    </div>
  </div>
  <div v-else>
    <!-- MATCH HERO -->
    <section class="match-hero">
      <div class="crumb">
        <a @click="$router.push('/')">← HUB</a>
        <span class="sep">/</span>
        <span>{{ match.season_name || "SEASON" }}</span>
        <span class="sep">/</span>
        <span style="color:var(--ink)">/{{ String(match.id).padStart(3,"0") }}</span>
      </div>

      <div class="versus">
        <div class="side">
          <div style="display:flex;gap:18px;align-items:center">
            <div class="crest" :style="{ color: teamColor(match.team1_name), width:'56px', height:'56px', fontSize:'15px' }">
              {{ teamTag(match.team1_name) }}
            </div>
            <div>
              <div class="tag">{{ teamTag(match.team1_name) }}</div>
            </div>
          </div>
          <div class="name" :class="{ win: isT1Win }">{{ match.team1_name }}</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:0.1em">
            {{ t1Picks.length ? 'PICKS · ' + t1Picks.join(', ') : '' }}
          </div>
        </div>

        <div class="score">
          <span class="s" :class="{ win: isT1Win }">{{ seriesScore.a }}</span>
          <span class="colon">—</span>
          <span class="s" :class="{ win: isT2Win }">{{ seriesScore.b }}</span>
        </div>

        <div class="side right">
          <div style="display:flex;gap:18px;align-items:center;flex-direction:row-reverse">
            <div class="crest" :style="{ color: teamColor(match.team2_name), width:'56px', height:'56px', fontSize:'15px' }">
              {{ teamTag(match.team2_name) }}
            </div>
            <div style="text-align:right">
              <div class="tag">{{ teamTag(match.team2_name) }}</div>
            </div>
          </div>
          <div class="name" :class="{ win: isT2Win }">{{ match.team2_name }}</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:0.1em">
            {{ t2Picks.length ? t2Picks.join(', ') + ' · PICKS' : '' }}
          </div>
        </div>
      </div>

      <div class="meta">
        <div class="cell">
          <div class="k">FORMAT</div>
          <div class="v">BO{{ match.max_maps }}</div>
        </div>
        <div class="cell">
          <div class="k">DATE</div>
          <div class="v">{{ fmtDate(match.start_time) }}</div>
        </div>
        <div class="cell">
          <div class="k">SAISON</div>
          <div class="v">{{ match.season_name || "—" }}</div>
        </div>
        <div class="cell">
          <div class="k">STATUT</div>
          <div class="v" :style="{ color: isLive ? 'var(--accent)' : 'inherit' }">
            <template v-if="isLive">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);animation:pulse 1.4s infinite;margin-right:6px" />
              LIVE
            </template>
            <template v-else>FINAL</template>
          </div>
        </div>
        <div class="right">
          <template v-for="(mp, i) in maps" :key="i">
            <a
              v-if="mp.demoFile"
              :href="`/demos/${mp.demoFile}`"
              class="btn ghost"
              download
            >↓ DEMO MAP {{ i + 1 }}</a>
          </template>
        </div>
      </div>
    </section>

    <!-- VETO -->
    <section v-if="vetos.length" class="section tight">
      <div class="section-head">
        <h2>The Veto</h2>
        <div class="right">
          <span class="index">— PG. 02</span>
          <span>·</span>
          <span>{{ vetos.length }} STEPS</span>
        </div>
      </div>
      <div class="veto-side-legend">
        <div><span class="sw" style="background:var(--accent);" /> PICK</div>
        <div><span class="sw" style="background:var(--bg-3);border:1px solid var(--line-strong);" /> BAN</div>
        <div><span class="sw" style="background:var(--ink);" /> DECIDER</div>
      </div>
      <div class="veto-grid">
        <div
          v-for="(step, i) in vetos"
          :key="step.id"
          class="map-tile"
          :class="vetoClass(step.pick_or_veto)"
        >
          <span class="step-no">{{ String(i + 1).padStart(2, "0") }}</span>
          <span class="step-team">{{ step.team_name ? teamTag(step.team_name) : "DEC" }}</span>
          <div
            class="map-bg"
            :style="{ '--h': getMapHue(step.map) }"
          />
          <div class="overlay" />
          <div class="content">
            <div>
              <div class="map-tile-name">{{ getMapName(step.map) }}</div>
              <div class="map-tile-sub">{{ step.map }}</div>
            </div>
            <span
              class="chip"
              :style="{ color: step.pick_or_veto === 'pick' ? 'var(--accent)' : step.pick_or_veto === 'decider' ? 'var(--ink)' : 'var(--ink-3)' }"
            >
              {{ step.pick_or_veto === "decider" ? "DECIDER" : step.pick_or_veto?.toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- MAP TABS -->
    <div v-if="maps.length" class="map-tabs">
      <div
        v-for="(mp, i) in maps"
        :key="mp.id"
        class="tab"
        :class="{ on: activeTab === i }"
        @click="activeTab = i"
      >
        <div class="n">MAP {{ i + 1 }} · {{ mp.map_number }}</div>
        <div class="name">{{ getMapName(mp.map_name) }}</div>
        <div class="score">
          <span :class="mp.team1_score > mp.team2_score ? 'w' : ''">{{ mp.team1_score }}</span>
          {{ " — " }}
          <span :class="mp.team2_score > mp.team1_score ? 'w' : ''">{{ mp.team2_score }}</span>
          <span v-if="!mp.end_time && mp.start_time" class="live-indicator"> · LIVE</span>
        </div>
      </div>
      <div class="pad" />
    </div>

    <!-- MAP PANEL -->
    <template v-if="maps.length && maps[activeTab]">
      <MapPanel
        :map="maps[activeTab]"
        :map-idx="activeTab"
        :map-count="maps.length"
        :match="match"
        :rounds="mapRounds[maps[activeTab].id] || []"
        :rounds-loading="mapRoundsLoading[maps[activeTab].id]"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getMatch, getMapRounds } from "../api/index.js";
import { getTeamColor, getTeamTag, getMapName, getMapHue } from "../utils/mapData.js";
import MapPanel from "../components/MapPanel.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const match = ref({});
const maps = ref([]);
const vetos = ref([]);
const activeTab = ref(0);
const mapRounds = ref({});
const mapRoundsLoading = ref({});

const teamColor = getTeamColor;
const teamTag = getTeamTag;

const isT1Win = computed(() => match.value.winner_id && match.value.winner_id === match.value.team1_id);
const isT2Win = computed(() => match.value.winner_id && match.value.winner_id === match.value.team2_id);
const isLive = computed(() => match.value.start_time && !match.value.end_time);

const seriesScore = computed(() => {
  const m = match.value;
  const a = m.team1_series_score;
  const b = m.team2_series_score;
  if (a != null && b != null) return { a, b };
  // Derive from map wins
  const mps = maps.value;
  return {
    a: mps.filter(mp => mp.team1_score > mp.team2_score).length,
    b: mps.filter(mp => mp.team2_score > mp.team1_score).length,
  };
});

const t1Picks = computed(() =>
  vetos.value
    .filter(v => v.pick_or_veto === "pick" && v.team_name === match.value.team1_name)
    .map(v => getMapName(v.map))
);
const t2Picks = computed(() =>
  vetos.value
    .filter(v => v.pick_or_veto === "pick" && v.team_name === match.value.team2_name)
    .map(v => getMapName(v.map))
);

function vetoClass(type) {
  if (type === "ban") return "banned";
  if (type === "pick") return "picked";
  return "";
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const mo = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${mo[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2,"0")} ${d.getUTCFullYear()} · ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")} UTC`;
}

onMounted(async () => {
  const { data } = await getMatch(route.params.id);
  match.value = data.match;
  maps.value = data.maps;
  vetos.value = data.vetos;
  loading.value = false;

  for (const m of data.maps) {
    mapRoundsLoading.value[m.id] = true;
    try {
      const { data: rounds } = await getMapRounds(m.id);
      mapRounds.value[m.id] = rounds;
    } catch {
      mapRounds.value[m.id] = [];
    } finally {
      mapRoundsLoading.value[m.id] = false;
    }
  }
});
</script>
