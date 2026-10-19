<template>
  <div>
    <!-- HERO -->
    <section class="hero">
      <div>
        <div class="eyebrow">
          <span>DOC.006 — DEMOS</span>
          <span>·</span>
          <span>{{ season ? season.name : "—" }}</span>
        </div>
        <h1>
          <div>SEASON<span class="accent"></span></div>
          <div style="margin-top:0.18em">DEMOS<span class="sub">— téléchargements GOTV</span></div>
        </h1>
      </div>
      <div class="meta-grid">
        <div class="cell">
          <div class="k">Démos</div>
          <div class="v">{{ filteredDemos.length }}</div>
        </div>
        <div class="cell">
          <div class="k">Matchs</div>
          <div class="v">{{ groupedMatches.length }}</div>
        </div>
        <div class="cell">
          <div class="k">Taille</div>
          <div class="v">{{ fmtSize(filteredSize).value }}<small>{{ fmtSize(filteredSize).unit }}</small></div>
        </div>
        <div class="cell">
          <div class="k">Équipes</div>
          <div class="v">{{ teams.length }}</div>
        </div>
      </div>
    </section>

    <!-- FILTERS + BULK DOWNLOADS -->
    <div class="filters-bar">
      <select v-model="seasonId" class="season-select">
        <option v-for="s in seasons" :key="s.id" :value="String(s.id)">{{ s.name }}</option>
      </select>
      <select v-model="teamId" class="season-select" :disabled="!teams.length">
        <option value="">TOUTES LES ÉQUIPES</option>
        <option v-for="t in teams" :key="t.id" :value="String(t.id)">{{ t.name }}</option>
      </select>
      <span class="spacer" />
      <a
        v-if="seasonId && demos.length"
        class="btn ghost"
        :href="seasonDemosArchiveUrl(seasonId)"
        download
      >↓ TOUTE LA SAISON · ZIP</a>
      <a
        v-if="seasonId && selectedTeam && filteredDemos.length"
        class="btn primary"
        :href="seasonDemosArchiveUrl(seasonId, teamId)"
        download
      >↓ {{ selectedTeam.name }} · ZIP</a>
    </div>

    <!-- LIST -->
    <section v-if="loading" class="section">
      <div class="empty">CHARGEMENT…</div>
    </section>
    <section v-else-if="!groupedMatches.length" class="section">
      <div class="empty">AUCUNE DÉMO DISPONIBLE</div>
    </section>
    <section v-else class="section">
      <div class="section-head">
        <h2>Démos</h2>
        <div class="right">
          <span>{{ filteredDemos.length }} FICHIER{{ filteredDemos.length > 1 ? "S" : "" }}</span>
          <span>·</span>
          <span>{{ fmtSize(filteredSize).value }} {{ fmtSize(filteredSize).unit }}</span>
        </div>
      </div>

      <div v-for="m in pagedMatches" :key="m.match_id" class="demo-match">
        <router-link :to="`/match/${m.match_id}`" class="head">
          <span class="id">/{{ String(m.match_id).padStart(3, "0") }}</span>
          <span class="teams">
            <span :style="{ color: getTeamColor(m.team1_name) }">{{ m.team1_name }}</span>
            <span class="vs">vs</span>
            <span :style="{ color: getTeamColor(m.team2_name) }">{{ m.team2_name }}</span>
          </span>
          <span class="meta">BO{{ m.max_maps }} · {{ fmtDate(m.end_time) }}</span>
        </router-link>
        <div class="maps">
          <a
            v-for="d in m.maps"
            :key="d.map_id"
            class="map-dl"
            :href="`/demos/${d.demoFile}`"
            download
          >
            <span class="n">MAP {{ d.map_number + 1 }}</span>
            <span class="name">{{ mapLabel(d.map_name) }}</span>
            <span class="score">{{ d.team1_score }}–{{ d.team2_score }}</span>
            <span class="size">{{ fmtSize(d.size).value }} {{ fmtSize(d.size).unit }}</span>
            <span class="arrow">↓</span>
          </a>
        </div>
      </div>

      <!-- PAGINATION -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="btn ghost" :disabled="currentPage === 1" @click="currentPage--">← PRÉC</button>
        <div class="page-info">
          <span class="cur">{{ String(currentPage).padStart(2, "0") }}</span>
          <span class="sep"> / </span>
          <span class="tot">{{ String(totalPages).padStart(2, "0") }}</span>
        </div>
        <button class="btn ghost" :disabled="currentPage === totalPages" @click="currentPage++">SUIV →</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getSeasons, getSeasonDemos, seasonDemosArchiveUrl } from "../api/index.js";
import { getTeamColor, MAP_DATA } from "../utils/mapData.js";

const route = useRoute();
const router = useRouter();

const seasons = ref([]);
const seasonId = ref("");
const teamId = ref(route.query.team ? String(route.query.team) : "");
const season = ref(null);
const teams = ref([]);
const demos = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const PAGE_SIZE = 15;

const selectedTeam = computed(() => teams.value.find(t => String(t.id) === teamId.value) || null);

const filteredDemos = computed(() => {
  if (!teamId.value) return demos.value;
  return demos.value.filter(d =>
    String(d.team1_id) === teamId.value || String(d.team2_id) === teamId.value
  );
});
const filteredSize = computed(() => filteredDemos.value.reduce((acc, d) => acc + d.size, 0));

// Regroupe les maps par match, en conservant l'ordre (plus récent d'abord)
const groupedMatches = computed(() => {
  const byMatch = new Map();
  for (const d of filteredDemos.value) {
    if (!byMatch.has(d.match_id)) {
      byMatch.set(d.match_id, { ...d, maps: [] });
    }
    const m = byMatch.get(d.match_id);
    m.maps.push(d);
    if (d.end_time && (!m.end_time || d.end_time > m.end_time)) m.end_time = d.end_time;
  }
  for (const m of byMatch.values()) m.maps.sort((a, b) => a.map_number - b.map_number);
  return [...byMatch.values()];
});

const pagedMatches = computed(() =>
  groupedMatches.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
);
const totalPages = computed(() => Math.max(1, Math.ceil(groupedMatches.value.length / PAGE_SIZE)));

function mapLabel(name) {
  return (MAP_DATA?.[name]?.name || (name || "").replace(/^de_/, "")).toUpperCase();
}

function fmtSize(bytes) {
  if (!bytes) return { value: "0", unit: "MO" };
  if (bytes >= 1024 ** 3) return { value: (bytes / 1024 ** 3).toFixed(1), unit: "GO" };
  return { value: Math.max(1, Math.round(bytes / 1024 ** 2)).toString(), unit: "MO" };
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const mo = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${mo[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}`;
}

async function loadSeason(id) {
  loading.value = true;
  try {
    const { data } = await getSeasonDemos(id);
    season.value = data.season;
    teams.value = data.teams;
    demos.value = data.demos;
    if (teamId.value && !data.teams.some(t => String(t.id) === teamId.value)) teamId.value = "";
  } catch {
    season.value = null;
    teams.value = [];
    demos.value = [];
  } finally {
    loading.value = false;
  }
}

watch(seasonId, (id, prev) => {
  if (!id) return;
  if (prev) teamId.value = "";
  currentPage.value = 1;
  if (route.params.id !== id) {
    router.replace({ path: `/demos/season/${id}`, query: teamId.value ? { team: teamId.value } : {} });
  }
  loadSeason(id);
});

watch(teamId, (id) => {
  currentPage.value = 1;
  const query = id ? { team: id } : {};
  if ((route.query.team || "") !== id) router.replace({ path: route.path, query });
});

onMounted(async () => {
  const { data } = await getSeasons();
  seasons.value = data;
  const fromRoute = route.params.id ? String(route.params.id) : "";
  seasonId.value = fromRoute || (data[0] ? String(data[0].id) : "");
  if (!seasonId.value) loading.value = false;
});
</script>

<style scoped>
.filters-bar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 20px var(--pad-x); border-bottom: 1px solid var(--line); background: var(--bg-1);
}
.filters-bar .spacer { flex: 1; }
.season-select {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; color: var(--ink);
  background: var(--bg-0); border: 1px solid var(--line); padding: 8px 12px;
}
.season-select:focus { outline: none; border-color: var(--accent); }
.filters-bar .btn { text-decoration: none; text-transform: uppercase; }

.empty { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; color: var(--ink-3); }

.demo-match { border-bottom: 1px solid var(--line); padding: 16px 0; }
.demo-match .head {
  display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap;
  color: inherit; text-decoration: none; margin-bottom: 10px;
}
.demo-match .head:hover .teams { color: var(--accent); }
.demo-match .id { font-family: var(--font-mono); font-size: 11px; color: var(--ink-4); }
.demo-match .teams { font-family: var(--font-body); font-weight: 600; font-size: 15px; display: flex; gap: 8px; }
.demo-match .vs { color: var(--ink-4); font-weight: 400; }
.demo-match .meta {
  margin-left: auto; font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 0.12em; color: var(--ink-3);
}

.maps { display: flex; flex-wrap: wrap; gap: 8px; }
.map-dl {
  display: flex; align-items: center; gap: 12px;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
  padding: 8px 12px; border: 1px solid var(--line); background: var(--bg-1);
  color: var(--ink-2); text-decoration: none; transition: border-color .15s, color .15s;
}
.map-dl:hover { border-color: var(--accent); color: var(--ink); }
.map-dl .n { color: var(--ink-4); }
.map-dl .name { color: var(--ink); font-weight: 600; }
.map-dl .size { color: var(--ink-3); }
.map-dl .arrow { color: var(--accent); }

.pagination {
  display: flex; align-items: center; justify-content: center; gap: 24px;
  padding: 32px 0 8px; margin-top: 8px;
}
.pagination .btn[disabled] { opacity: 0.3; pointer-events: none; }
.page-info { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.14em; color: var(--ink-3); }
.page-info .cur { font-size: 18px; color: var(--ink); font-weight: 600; }

@media (max-width: 720px) {
  .demo-match .meta { margin-left: 0; }
  .map-dl { flex: 1 1 100%; }
}
</style>
