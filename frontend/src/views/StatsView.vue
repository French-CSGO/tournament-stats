<template>
  <div>
    <!-- HERO -->
    <section class="hero">
      <div>
        <div class="eyebrow">
          <span>DOC.002 — STATS LEAD</span>
          <span>·</span>
          <span>{{ seasonLabel }}</span>
          <span>·</span>
          <span>{{ statsData.players?.length || 0 }} JOUEURS</span>
        </div>
        <h1>
          <div>THE<span class="accent">/</span></div>
          <div style="margin-top:0.18em">LEADERBOARD<span class="sub">— performance index</span></div>
        </h1>
      </div>
      <div class="meta-grid">
        <div class="cell">
          <div class="k">Top Rating</div>
          <div class="v" style="color:var(--accent)">{{ top3[0] ? Number(top3[0].rating).toFixed(2) : "—" }}</div>
        </div>
        <div class="cell">
          <div class="k">Avg ADR</div>
          <div class="v">{{ avgAdr }}</div>
        </div>
        <div class="cell">
          <div class="k">Joueurs</div>
          <div class="v">{{ statsData.players?.length || 0 }}</div>
        </div>
        <div class="cell">
          <div class="k">Avg HS</div>
          <div class="v">{{ avgHs }}<small>%</small></div>
        </div>
      </div>
    </section>

    <!-- SEASON STRIP -->
    <div class="season-strip">
      <div class="item" :class="{ on: !selectedSeason }" @click="selectSeason(null)">
        <div class="sub">ALL TIME</div>
        <div class="label">TOUT</div>
        <div class="stat">TOUTES LES SAISONS</div>
      </div>
      <div
        v-for="s in seasons"
        :key="s.id"
        class="item"
        :class="{ on: selectedSeason === s.id }"
        @click="selectSeason(s.id)"
      >
        <div class="sub">{{ formatDateRange(s.start_date, s.end_date) }}</div>
        <div class="label">{{ s.name }}</div>
        <div class="stat">{{ s.match_count }} MATCHS</div>
      </div>
    </div>

    <div v-if="loading" class="section">
      <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;color:var(--ink-3)">
        CHARGEMENT…
      </div>
    </div>
    <template v-else>
      <!-- PODIUM -->
      <section v-if="top3.length >= 3" class="section">
        <div class="section-head">
          <h2>Podium</h2>
          <div class="right">
            <span class="index">— PG. 02</span>
            <span>·</span>
            <span>BY RATING</span>
          </div>
        </div>
        <div class="podium">
          <PodiumCard :rank="2" :player="top3[1]" cls="top2" />
          <PodiumCard :rank="1" :player="top3[0]" cls="top1" />
          <PodiumCard :rank="3" :player="top3[2]" cls="top3" />
        </div>
      </section>

      <!-- FILTERS -->
      <div class="filter-row">
        <div class="group">
          <span class="k">TEAM:</span>
          <select v-model="teamFilter">
            <option value="">ALL TEAMS</option>
            <option v-for="t in teams" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="group">
          <span class="k">MIN ROUNDS:</span>
          <input type="range" min="0" max="500" step="10" v-model.number="minRounds" />
          <span style="color:var(--accent);min-width:40px;text-align:right">{{ minRounds }}</span>
        </div>
        <div class="group">
          <span class="k">SORT:</span>
          <span style="color:var(--accent)">{{ sortKey.toUpperCase() }} {{ sortDir === "asc" ? "↑" : "↓" }}</span>
        </div>
        <div class="group spacer" />
        <div class="group">
          <span>{{ filtered.length }} / {{ statsData.players?.length || 0 }} JOUEURS</span>
        </div>
      </div>

      <!-- TABLE -->
      <section class="section" style="padding-top:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th style="width:60px">#</th>
              <SortTH k="name" label="JOUEUR" :sort-key="sortKey" :sort-dir="sortDir" @sort="onSort" />
              <th style="width:90px">ÉQUIPE</th>
              <SortTH k="kd" label="K/D" :sort-key="sortKey" :sort-dir="sortDir" @sort="onSort" num />
              <SortTH k="adr" label="ADR" :sort-key="sortKey" :sort-dir="sortDir" @sort="onSort" num />
              <SortTH k="hs" label="HS%" :sort-key="sortKey" :sort-dir="sortDir" @sort="onSort" num />
              <SortTH k="kills" label="K" :sort-key="sortKey" :sort-dir="sortDir" @sort="onSort" num />
              <SortTH k="deaths" label="D" :sort-key="sortKey" :sort-dir="sortDir" @sort="onSort" num />
              <SortTH k="maps" label="MAPS" :sort-key="sortKey" :sort-dir="sortDir" @sort="onSort" num />
              <SortTH k="rating" label="RATING" :sort-key="sortKey" :sort-dir="sortDir" @sort="onSort" num />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in sorted" :key="p.steam_id">
              <td :class="'rank' + (i === 0 ? ' top1' : '')">{{ String(i + 1).padStart(2, "0") }}</td>
              <td>
                <div class="player">
                  <div>
                    <div class="h">{{ p.name }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3)">{{ p.team || "—" }}</span>
              </td>
              <td class="num">{{ Number(p.kd).toFixed(2) }}</td>
              <td class="num">{{ Number(p.adr).toFixed(1) }}</td>
              <td class="num">{{ p.hs }}%</td>
              <td class="num">{{ p.kills }}</td>
              <td class="num">{{ p.deaths }}</td>
              <td class="num dim">{{ p.maps }}</td>
              <td class="num">
                <span :class="'rating-pill ' + ratingClass(p.rating)">{{ Number(p.rating).toFixed(2) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getStats, getSeasons } from "../api/index.js";
import { ratingClass } from "../utils/mapData.js";
import PodiumCard from "../components/PodiumCard.vue";
import SortTH from "../components/SortTH.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const seasons = ref([]);
const statsData = ref({ kpis: {}, players: [], mapStats: [] });
const selectedSeason = ref(route.params.id ? parseInt(route.params.id) : null);

const sortKey = ref("rating");
const sortDir = ref("desc");
const teamFilter = ref("");
const minRounds = ref(0);

const seasonLabel = computed(() => {
  if (!selectedSeason.value) return "ALL TIME";
  return seasons.value.find(s => s.id === selectedSeason.value)?.name || "SEASON";
});

const teams = computed(() => {
  const set = new Set((statsData.value.players || []).map(p => p.team).filter(Boolean));
  return [...set].sort();
});

const top3 = computed(() =>
  [...(statsData.value.players || [])].sort((a, b) => b.rating - a.rating).slice(0, 3)
);

const avgAdr = computed(() => {
  const p = statsData.value.players || [];
  if (!p.length) return 0;
  return (p.reduce((s, x) => s + Number(x.adr), 0) / p.length).toFixed(1);
});

const avgHs = computed(() => {
  const p = statsData.value.players || [];
  if (!p.length) return 0;
  return Math.round(p.reduce((s, x) => s + Number(x.hs), 0) / p.length);
});

const filtered = computed(() => {
  return (statsData.value.players || []).filter(p =>
    (!teamFilter.value || p.team === teamFilter.value) &&
    (Number(p.maps) * 15 >= minRounds.value)
  );
});

const sorted = computed(() => {
  const dir = sortDir.value === "asc" ? 1 : -1;
  return [...filtered.value].sort((a, b) => {
    const va = a[sortKey.value], vb = b[sortKey.value];
    if (typeof va === "string") return dir * va.localeCompare(vb);
    return dir * (Number(va) - Number(vb));
  });
});

function onSort(k) {
  if (k === sortKey.value) sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  else { sortKey.value = k; sortDir.value = "desc"; }
}

async function selectSeason(id) {
  selectedSeason.value = id;
  if (id) router.push(`/stats/season/${id}`);
  else router.push("/stats");
  await load();
}

async function load() {
  loading.value = true;
  try {
    const { data } = await getStats(selectedSeason.value);
    statsData.value = data;
  } finally {
    loading.value = false;
  }
}

function formatDateRange(start, end) {
  if (!start) return "";
  const s = new Date(start);
  const mo = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  if (!end) return `${mo[s.getUTCMonth()]} ${s.getUTCFullYear()}`;
  const e = new Date(end);
  return `${mo[s.getUTCMonth()]} — ${mo[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
}

watch(() => route.params.id, (id) => {
  selectedSeason.value = id ? parseInt(id) : null;
  load();
});

onMounted(async () => {
  const [{ data: s }] = await Promise.all([getSeasons()]);
  seasons.value = s;
  await load();
});
</script>
