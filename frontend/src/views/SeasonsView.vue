<template>
  <div>
    <!-- HERO -->
    <section class="hero">
      <div>
        <div class="eyebrow">
          <span>DOC.001 — INDEX</span>
          <span>·</span>
          <span v-if="liveMatch" class="chip-live">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px var(--accent);animation:pulse 1.4s infinite;margin-right:6px" />
            ON AIR
          </span>
          <span>·</span>
          <span>{{ today }}</span>
        </div>
        <h1>
          <div>TOURNAMENT<span class="accent"></span></div>
          <div style="margin-top:0.18em">STATS<span class="sub">— a broadcast brief</span></div>
        </h1>
      </div>
      <div class="meta-grid">
        <div class="cell">
          <div class="k">Saisons</div>
          <div class="v">{{ seasons.length.toString().padStart(2, "0") }}</div>
        </div>
        <div class="cell">
          <div class="k">Matchs</div>
          <div class="v">{{ kpis.totalMatches }}</div>
        </div>
        <div class="cell">
          <div class="k">Maps</div>
          <div class="v">{{ kpis.mapsPlayed }}</div>
        </div>
        <div class="cell">
          <div class="k">Kills</div>
          <div class="v">{{ formatBig(kpis.totalKills) }}</div>
        </div>
      </div>
    </section>

    <!-- SEASON STRIP -->
    <div class="season-strip">
      <div
        v-for="s in seasons"
        :key="s.id"
        class="item"
        :class="{ on: selectedSeasonId === s.id }"
        @click="selectSeason(s.id)"
      >
        <div class="sub">{{ formatDateRange(s.start_date, s.end_date) }}</div>
        <div class="label">{{ s.name }}</div>
        <div class="stat">{{ s.match_count }} MATCHS</div>
      </div>
    </div>

    <!-- FEATURED LIVE MATCH -->
    <template v-if="liveMatch">
      <div class="featured-live" style="cursor:pointer" @click="goToMatch(liveMatch.id)">
        <!-- Left team -->
        <div class="side">
          <div class="top">
            <div class="crest" :style="{ color: getTeamColor(liveMatch.team1_name), width:'48px', height:'48px', fontSize:'14px' }">
              {{ getTeamTag(liveMatch.team1_name) }}
            </div>
            <div>
              <div class="tag">{{ getTeamTag(liveMatch.team1_name) }}</div>
              <div class="team-name" :style="{ color: series(liveMatch).a > series(liveMatch).b ? 'var(--accent)' : 'var(--ink)' }">
                {{ liveMatch.team1_name }}
              </div>
            </div>
          </div>
        </div>
        <!-- Center -->
        <div class="center">
          <div class="stage">BO{{ liveMatch.max_maps }}</div>
          <div class="score-row">
            <span class="s" :class="{ win: series(liveMatch).a > series(liveMatch).b }">{{ series(liveMatch).a }}</span>
            <span class="colon">—</span>
            <span class="s" :class="{ win: series(liveMatch).b > series(liveMatch).a }">{{ series(liveMatch).b }}</span>
          </div>
          <div class="now">
            <span class="dot" />LIVE
          </div>
        </div>
        <!-- Right team -->
        <div class="side right">
          <div class="top">
            <div>
              <div class="tag" style="text-align:right">{{ getTeamTag(liveMatch.team2_name) }}</div>
              <div class="team-name" :style="{ color: series(liveMatch).b > series(liveMatch).a ? 'var(--accent)' : 'var(--ink)' }">
                {{ liveMatch.team2_name }}
              </div>
            </div>
            <div class="crest" :style="{ color: getTeamColor(liveMatch.team2_name), width:'48px', height:'48px', fontSize:'14px' }">
              {{ getTeamTag(liveMatch.team2_name) }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- MATCH LIST -->
    <section v-if="seasonLoading" class="section">
      <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;color:var(--ink-3)">
        CHARGEMENT…
      </div>
    </section>
    <section v-else-if="seasonMatches.length" class="section">
      <div class="section-head">
        <h2>The Schedule</h2>
        <div class="right">
          <span class="index">— PG. 02</span>
          <span>·</span>
          <span>{{ seasonMatches.length }} MATCHS</span>
        </div>
      </div>
      <div>
        <div
          v-for="m in pagedMatches"
          :key="m.id"
          class="match-row"
          :class="{ live: isLive(m) }"
          @click="goToMatch(m.id)"
        >
          <span class="id">/{{ String(m.id).padStart(3, "0") }}</span>
          <div class="team">
            <div class="crest" :style="{ color: getTeamColor(m.team1_name), width:'36px', height:'36px' }">
              {{ getTeamTag(m.team1_name) }}
            </div>
            <div>
              <div class="tag">{{ getTeamTag(m.team1_name) }}</div>
              <div class="name" :style="{ color: m.winner_id === m.team1_id ? 'var(--accent)' : 'inherit' }">
                {{ m.team1_name }}
              </div>
            </div>
          </div>
          <div class="score">
            <span class="a" :class="m.winner_id === m.team1_id ? 'win' : (m.winner_id ? 'loss' : '')">{{ series(m).a }}</span>
            <span class="vs">—</span>
            <span class="b" :class="m.winner_id === m.team2_id ? 'win' : (m.winner_id ? 'loss' : '')">{{ series(m).b }}</span>
          </div>
          <div class="team right">
            <div class="crest" :style="{ color: getTeamColor(m.team2_name), width:'36px', height:'36px' }">
              {{ getTeamTag(m.team2_name) }}
            </div>
            <div>
              <div class="tag" style="text-align:right">{{ getTeamTag(m.team2_name) }}</div>
              <div class="name" :style="{ color: m.winner_id === m.team2_id ? 'var(--accent)' : 'inherit', textAlign: 'right' }">
                {{ m.team2_name }}
              </div>
            </div>
          </div>
          <div class="stage">BO{{ m.max_maps }}</div>
          <div class="date">
            <span v-if="isLive(m)" class="live-tag">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);animation:pulse 1.4s infinite" />
              LIVE
            </span>
            <span v-else>{{ fmtDate(m.start_time) }}</span>
          </div>
          <div class="arrow">→</div>
        </div>
      </div>

      <!-- PAGINATION -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="btn ghost"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >← PRÉC</button>
        <div class="page-info">
          <span class="cur">{{ String(currentPage).padStart(2, "0") }}</span>
          <span class="sep"> / </span>
          <span class="tot">{{ String(totalPages).padStart(2, "0") }}</span>
        </div>
        <button
          class="btn ghost"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >SUIV →</button>
      </div>
    </section>

    <!-- BOTTOM GRID: Top Frags + Map Pool -->
    <section
      v-if="topPlayers.length || mapStats.length"
      class="section"
      style="display:grid;grid-template-columns:1.4fr 1fr;gap:0;padding:0;border-bottom:none"
    >
      <!-- Top Frags -->
      <div v-if="topPlayers.length" style="padding:56px var(--pad-x);border-right:1px solid var(--line);border-bottom:1px solid var(--line)">
        <div class="section-head" style="margin-bottom:24px">
          <h2 style="font-size:clamp(24px,3vw,40px)">Top Frags</h2>
          <router-link to="/stats" class="index" style="color:var(--accent)">— VOIR TOUT</router-link>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>JOUEUR</th>
              <th class="num">K/D</th>
              <th class="num">ADR</th>
              <th class="num">RATING</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(p, i) in topPlayers"
              :key="p.steam_id"
              style="cursor:pointer"
              @click="$router.push('/stats')"
            >
              <td :class="'rank' + (i === 0 ? ' top1' : '')">{{ String(i + 1).padStart(2, "0") }}</td>
              <td>
                <div class="player">
                  <div>
                    <div class="h">{{ p.name }}</div>
                    <div class="team-tag">{{ p.team }}</div>
                  </div>
                </div>
              </td>
              <td class="num">{{ Number(p.kd).toFixed(2) }}</td>
              <td class="num">{{ Number(p.adr).toFixed(1) }}</td>
              <td class="num">
                <span :class="'rating-pill ' + ratingClass(p.rating)">{{ Number(p.rating).toFixed(2) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Map Pool -->
      <div v-if="mapStats.length" style="padding:56px var(--pad-x);border-bottom:1px solid var(--line);background:var(--bg-1)">
        <div class="section-head" style="margin-bottom:24px">
          <h2 style="font-size:clamp(24px,3vw,40px)">Map Pool</h2>
          <span class="index">— PG. 04</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div
            v-for="(m, i) in mapStats.slice(0, 6)"
            :key="m.map"
            style="position:relative;aspect-ratio:2/1;border:1px solid var(--line);overflow:hidden;display:flex;align-items:flex-end;padding:14px"
          >
            <div
              class="map-bg"
              :style="{ '--h': getMapHue('de_' + m.map.toLowerCase()), position: 'absolute', inset: 0 }"
            />
            <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.85))" />
            <div style="position:relative;display:flex;justify-content:space-between;width:100%">
              <div>
                <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;color:var(--ink-3)">de_{{ m.map.toLowerCase() }}</div>
                <div style="font-family:var(--font-display);font-size:22px;font-weight:500;letter-spacing:0.02em;text-transform:uppercase;line-height:1">{{ m.map.toUpperCase() }}</div>
              </div>
              <div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-2);text-align:right">
                <div>{{ m.played }} <span style="color:var(--ink-4)">PLAYED</span></div>
                <div style="color:var(--accent)">
                  {{ m.ctWins + m.tWins > 0 ? Math.round(m.ctWins / (m.ctWins + m.tWins) * 100) : 0 }}% CT
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { getSeasons, getSeason, getStats } from "../api/index.js";
import { getTeamColor, getTeamTag, getMapHue, ratingClass } from "../utils/mapData.js";

const router = useRouter();
const seasons = ref([]);
const selectedSeasonId = ref(null);
const seasonMatches = ref([]);
const seasonLoading = ref(false);
const currentPage = ref(1);
const PAGE_SIZE = 10;
const topPlayers = ref([]);
const mapStats = ref([]);
const kpis = ref({ totalMatches: 0, mapsPlayed: 0, totalKills: 0, avgAdr: 0 });

const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const pagedMatches = computed(() =>
  seasonMatches.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
);
const totalPages = computed(() => Math.ceil(seasonMatches.value.length / PAGE_SIZE));

watch(seasonMatches, () => { currentPage.value = 1; });

const liveMatch = computed(() =>
  seasonMatches.value.find(m => isLive(m))
);

function isLive(m) {
  return m.start_time && !m.end_time;
}

function series(m) {
  const a = m.team1_series_score ?? 0;
  const b = m.team2_series_score ?? 0;
  if (a || b) return { a, b };
  // BO1: derive from direct score
  if (m.max_maps === 1) {
    const t1 = m.map1_team1_score ?? 0;
    const t2 = m.map1_team2_score ?? 0;
    return { a: t1 > t2 ? 1 : 0, b: t2 > t1 ? 1 : 0 };
  }
  return { a, b };
}

function formatBig(n) {
  const v = parseInt(n) || 0;
  if (v >= 1000) return (v / 1000).toFixed(1) + "K";
  return String(v);
}

function formatDateRange(start, end) {
  if (!start) return "";
  const s = new Date(start);
  const mo = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  if (!end) return `${mo[s.getUTCMonth()]} ${s.getUTCFullYear()}`;
  const e = new Date(end);
  return `${mo[s.getUTCMonth()]} — ${mo[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const mo = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${mo[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2,"0")} · ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
}

async function selectSeason(id) {
  selectedSeasonId.value = id;
  seasonLoading.value = true;
  try {
    const [{ data: sData }, { data: statsData }] = await Promise.all([
      getSeason(id),
      getStats(id),
    ]);
    seasonMatches.value = sData.matches || [];
    topPlayers.value = (statsData.players || []).slice(0, 8);
    mapStats.value = statsData.mapStats || [];
  } finally {
    seasonLoading.value = false;
  }
}

function goToMatch(id) {
  router.push(`/match/${id}`);
}

onMounted(async () => {
  const [{ data: sData }, { data: statsData }] = await Promise.all([
    getSeasons(),
    getStats(),
  ]);
  seasons.value = sData;
  kpis.value = statsData.kpis || kpis.value;
  topPlayers.value = (statsData.players || []).slice(0, 8);
  mapStats.value = statsData.mapStats || [];
  if (sData.length) {
    selectedSeasonId.value = sData[0].id;
    const { data: first } = await getSeason(sData[0].id);
    seasonMatches.value = first.matches || [];
  }
});
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 32px 0 8px;
  border-top: 1px solid var(--line);
  margin-top: 8px;
}
.pagination .btn[disabled] {
  opacity: 0.3;
  pointer-events: none;
}
.page-info {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--ink-3);
}
.page-info .cur {
  font-size: 18px;
  color: var(--ink);
  font-weight: 600;
}

.map-bg {
  background:
    radial-gradient(120% 80% at 20% 110%, hsla(var(--h),60%,55%,0.7), transparent 60%),
    radial-gradient(100% 80% at 90% 10%, hsla(var(--h),80%,40%,0.55), transparent 50%),
    linear-gradient(135deg, hsl(var(--h), 45%, 22%) 0%, hsl(var(--h), 35%, 12%) 70%);
}
.map-bg::after {
  content: ""; position: absolute; inset: 0;
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 22px),
    repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 18px);
  mix-blend-mode: overlay;
}
</style>
