<template>
  <div>
    <!-- HERO -->
    <section class="hero">
      <div>
        <div class="eyebrow">
          <span>DOC.005 — MATCHES</span>
          <span>·</span>
          <span>{{ filteredMatches.length }} RÉSULTAT{{ filteredMatches.length > 1 ? "S" : "" }}</span>
        </div>
        <h1>
          <div>ALL<span class="accent"></span></div>
          <div style="margin-top:0.18em">MATCHES<span class="sub">— calendrier &amp; résultats</span></div>
        </h1>
      </div>
      <div class="meta-grid">
        <div class="cell">
          <div class="k">Total</div>
          <div class="v">{{ matches.length }}</div>
        </div>
        <div class="cell">
          <div class="k">En direct</div>
          <div class="v" :style="{ color: liveCount ? 'var(--accent)' : 'inherit' }">{{ liveCount }}</div>
        </div>
        <div class="cell">
          <div class="k">Terminés</div>
          <div class="v">{{ finishedCount }}</div>
        </div>
        <div class="cell">
          <div class="k">À venir</div>
          <div class="v">{{ upcomingCount }}</div>
        </div>
      </div>
    </section>

    <!-- FILTERS -->
    <div class="filters-bar">
      <div class="status-tabs">
        <button
          v-for="opt in statusOptions"
          :key="opt.value"
          class="tab"
          :class="{ on: statusFilter === opt.value }"
          @click="statusFilter = opt.value"
        >{{ opt.label }}</button>
      </div>
      <select v-model="seasonFilter" class="season-select">
        <option value="">TOUTES LES SAISONS</option>
        <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <input
        v-model="teamSearch"
        type="text"
        class="team-search"
        placeholder="RECHERCHER UNE ÉQUIPE…"
      />
    </div>

    <!-- MATCH LIST -->
    <section v-if="loading" class="section">
      <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;color:var(--ink-3)">
        CHARGEMENT…
      </div>
    </section>
    <section v-else-if="!filteredMatches.length" class="section">
      <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;color:var(--ink-3)">
        AUCUN MATCH TROUVÉ
      </div>
    </section>
    <section v-else class="section">
      <div class="section-head">
        <h2>Résultats</h2>
        <div class="right">
          <span class="index">— PG. 01</span>
          <span>·</span>
          <span>{{ filteredMatches.length }} MATCHS</span>
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
            <span class="a" :class="m.winner_id === m.team1_id ? 'win' : (m.winner_id ? 'loss' : '')">{{ score(m).t1 }}</span>
            <span class="vs">—</span>
            <span class="b" :class="m.winner_id === m.team2_id ? 'win' : (m.winner_id ? 'loss' : '')">{{ score(m).t2 }}</span>
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
            <span v-else-if="!m.start_time">À VENIR</span>
            <span v-else>{{ fmtDate(m.start_time) }}</span>
            <div class="season-tag">{{ m.season_name }}</div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { getMatches, getSeasons } from "../api/index.js";
import { getTeamColor, getTeamTag } from "../utils/mapData.js";
import { matchScore } from "../utils/matchScore.js";

const router = useRouter();

const matches = ref([]);
const seasons = ref([]);
const loading = ref(true);
const statusFilter = ref("all");
const seasonFilter = ref("");
const teamSearch = ref("");
const currentPage = ref(1);
const PAGE_SIZE = 15;

const statusOptions = [
  { value: "all",       label: "TOUS" },
  { value: "live",      label: "EN DIRECT" },
  { value: "finished",  label: "TERMINÉS" },
  { value: "upcoming",  label: "À VENIR" },
];

function isLive(m) {
  return !!(m.start_time && !m.end_time);
}

function score(m) {
  return matchScore(m);
}

const liveCount = computed(() => matches.value.filter(isLive).length);
const finishedCount = computed(() => matches.value.filter(m => !!m.end_time).length);
const upcomingCount = computed(() => matches.value.filter(m => !m.start_time).length);

const filteredMatches = computed(() => {
  let list = matches.value;

  if (statusFilter.value === "live") list = list.filter(isLive);
  else if (statusFilter.value === "finished") list = list.filter(m => !!m.end_time);
  else if (statusFilter.value === "upcoming") list = list.filter(m => !m.start_time);

  if (seasonFilter.value) list = list.filter(m => String(m.season_id) === String(seasonFilter.value));

  const q = teamSearch.value.trim().toLowerCase();
  if (q) {
    list = list.filter(m =>
      (m.team1_name || "").toLowerCase().includes(q) ||
      (m.team2_name || "").toLowerCase().includes(q)
    );
  }

  return list;
});

const pagedMatches = computed(() =>
  filteredMatches.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredMatches.value.length / PAGE_SIZE)));

watch([statusFilter, seasonFilter, teamSearch], () => { currentPage.value = 1; });

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const mo = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${mo[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2,"0")} · ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
}

function goToMatch(id) {
  router.push(`/match/${id}`);
}

onMounted(async () => {
  const [{ data: matchData }, { data: seasonData }] = await Promise.all([
    getMatches(),
    getSeasons(),
  ]);
  matches.value = matchData;
  seasons.value = seasonData;
  loading.value = false;
});
</script>

<style scoped>
.filters-bar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 20px var(--pad-x); border-bottom: 1px solid var(--line); background: var(--bg-1);
}
.status-tabs { display: flex; gap: 0; border: 1px solid var(--line); flex: none; }
.status-tabs .tab {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em;
  padding: 8px 16px; color: var(--ink-3); background: transparent; border: none;
  border-right: 1px solid var(--line); cursor: pointer; transition: color .15s, background .15s;
}
.status-tabs .tab:last-child { border-right: none; }
.status-tabs .tab:hover { color: var(--ink); }
.status-tabs .tab.on { color: #000; background: var(--accent); }

.season-select, .team-search {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; color: var(--ink);
  background: var(--bg-0); border: 1px solid var(--line); padding: 8px 12px;
}
.team-search { flex: 1; min-width: 180px; }
.team-search::placeholder { color: var(--ink-4); }
.season-select:focus, .team-search:focus { outline: none; border-color: var(--accent); }

.match-row .season-tag {
  font-family: var(--font-mono); font-size: 9px; color: var(--ink-4); letter-spacing: 0.08em;
  margin-top: 2px; text-transform: uppercase;
}

.pagination {
  display: flex; align-items: center; justify-content: center; gap: 24px;
  padding: 32px 0 8px; border-top: 1px solid var(--line); margin-top: 8px;
}
.pagination .btn[disabled] { opacity: 0.3; pointer-events: none; }
.page-info { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.14em; color: var(--ink-3); }
.page-info .cur { font-size: 18px; color: var(--ink); font-weight: 600; }
</style>
