<template>
  <v-app theme="dark" class="broadcast-app">
    <div class="broadcast-root grain">
      <!-- Broadcast top bar -->
      <header class="bcast-bar">
        <span class="station">G5<span class="slash">/</span>STATS</span>
        <span class="live"><span class="dot" />ON AIR</span>
        <span class="time-cell">{{ utcTime }}</span>
        <span class="ticker">
          <div class="ticker-inner">
            <template v-for="n in 2" :key="n">
              <template v-for="(item, i) in tickerItems" :key="n + '-' + i">
                <span>{{ item }}</span>
                <span>·</span>
              </template>
            </template>
          </div>
        </span>
        <span class="nav">
          <router-link to="/" class="nav-link" :class="{ on: isHub }">HUB</router-link>
          <router-link to="/matches" class="nav-link" :class="{ on: route.path.startsWith('/matches') }">MATCHES</router-link>
          <router-link to="/stats" class="nav-link" :class="{ on: route.path.startsWith('/stats') }">STATS</router-link>
          <router-link to="/admin" class="nav-link" :class="{ on: route.path.startsWith('/admin') }">ADMIN</router-link>
        </span>
      </header>

      <main>
        <router-view />
      </main>

      <footer class="bcast-footer">
        <span>
          <span class="dim">BUILD</span> &nbsp;
          G5-STATS / FRONT-END · {{ buildDate }}
        </span>
        <span>BUILT ON GET5 / G5API · TOURNAMENT STATS</span>
        <a
          href="https://github.com/French-CSGO/tournament-stats"
          target="_blank"
          style="display:flex;align-items:center;gap:6px;color:inherit;"
        >
          <span style="font-size:13px">⌥</span> French-CSGO/tournament-stats
        </a>
      </footer>
    </div>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { getMatches, getStats } from "./api/index.js";
import { getTeamTag } from "./utils/mapData.js";
import { matchScore } from "./utils/matchScore.js";

const route = useRoute();
const utcTime = ref("--:--:-- UTC");
const buildDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const isHub = computed(() =>
  route.path === "/" || route.path.startsWith("/season")
);

let timer;
function tick() {
  const d = new Date();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  utcTime.value = `${hh}:${mm}:${ss} UTC`;
}

// Scrolling ticker: latest results + headline stats
const recentMatches = ref([]);
const topPlayer = ref(null);
const tickerKpis = ref({ totalMatches: 0, mapsPlayed: 0 });

let tickerTimer;
async function loadTickerData() {
  try {
    const [{ data: matches }, { data: stats }] = await Promise.all([
      getMatches({ status: "finished" }),
      getStats(),
    ]);
    recentMatches.value = matches.slice(0, 6);
    topPlayer.value = (stats.players || [])[0] || null;
    tickerKpis.value = stats.kpis || tickerKpis.value;
  } catch {
    // the ticker is decorative — fail silently and keep the previous content
  }
}

const tickerItems = computed(() => {
  const items = [];

  for (const m of recentMatches.value) {
    const { t1, t2 } = matchScore(m);
    items.push(`RÉSULTAT · ${getTeamTag(m.team1_name)} ${t1}–${t2} ${getTeamTag(m.team2_name)}`);
  }

  if (topPlayer.value) {
    items.push(
      `TOP FRAGGER · ${topPlayer.value.name} — ${topPlayer.value.kills} KILLS · RATING ${Number(topPlayer.value.rating).toFixed(2)}`
    );
  }

  if (tickerKpis.value.totalMatches) {
    items.push(`${tickerKpis.value.totalMatches} MATCHS JOUÉS · ${tickerKpis.value.mapsPlayed} MAPS`);
  }

  if (!items.length) {
    items.push("TOURNAMENT STATS · CS2 / CS:GO · POWERED BY GET5");
  }

  return items;
});

onMounted(() => {
  tick();
  timer = setInterval(tick, 1000);
  loadTickerData();
  tickerTimer = setInterval(loadTickerData, 60000);
});
onUnmounted(() => {
  clearInterval(timer);
  clearInterval(tickerTimer);
});
</script>

<style>
.broadcast-app,
.broadcast-app .v-application__wrap {
  background: var(--bg-0) !important;
  min-height: unset !important;
}
.broadcast-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-0);
}
.broadcast-root > main { flex: 1; }

.bcast-bar .time-cell {
  padding: 0 16px; height: 100%; display: flex; align-items: center;
  border-right: 1px solid var(--line); min-width: 140px;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; color: var(--ink-3);
}
.nav-link {
  padding: 0 18px; display: flex; align-items: center; height: 100%;
  border-left: 1px solid var(--line); cursor: pointer;
  transition: color .15s, background .15s;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--ink-3); text-decoration: none;
}
.nav-link:hover { color: var(--ink); }
.nav-link.on { color: #000; background: var(--accent); }
.bcast-bar .dim { color: var(--ink-4); }
</style>
