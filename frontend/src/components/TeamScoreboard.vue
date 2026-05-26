<template>
  <div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
      <div
        class="crest"
        :style="{ color: getTeamColor(teamName), width:'32px', height:'32px', fontSize:'11px' }"
      >{{ getTeamTag(teamName) }}</div>
      <div style="font-family:var(--font-display);font-size:28px;font-weight:500;letter-spacing:0.01em;text-transform:uppercase">
        {{ teamName }}
      </div>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>JOUEUR</th>
          <th class="num" @click="onSort('kills')" :class="{ sorted: sortKey === 'kills' }">K <span class="arr">{{ arr('kills') }}</span></th>
          <th class="num" @click="onSort('deaths')" :class="{ sorted: sortKey === 'deaths' }">D <span class="arr">{{ arr('deaths') }}</span></th>
          <th class="num" @click="onSort('assists')" :class="{ sorted: sortKey === 'assists' }">A <span class="arr">{{ arr('assists') }}</span></th>
          <th class="num" @click="onSort('kd')" :class="{ sorted: sortKey === 'kd' }">K/D <span class="arr">{{ arr('kd') }}</span></th>
          <th class="num" @click="onSort('hs')" :class="{ sorted: sortKey === 'hs' }">HS% <span class="arr">{{ arr('hs') }}</span></th>
          <th class="num" @click="onSort('adr')" :class="{ sorted: sortKey === 'adr' }">ADR <span class="arr">{{ arr('adr') }}</span></th>
          <th class="num" @click="onSort('k2')" :class="{ sorted: sortKey === 'k2' }">2K <span class="arr">{{ arr('k2') }}</span></th>
          <th class="num" @click="onSort('k3')" :class="{ sorted: sortKey === 'k3' }">3K <span class="arr">{{ arr('k3') }}</span></th>
          <th class="num" @click="onSort('k4')" :class="{ sorted: sortKey === 'k4' }">4K <span class="arr">{{ arr('k4') }}</span></th>
          <th class="num" @click="onSort('k5')" :class="{ sorted: sortKey === 'k5' }">5K <span class="arr">{{ arr('k5') }}</span></th>
          <th class="num" @click="onSort('rating')" :class="{ sorted: sortKey === 'rating' }">RATING <span class="arr">{{ arr('rating') }}</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in sorted" :key="p.steam_id">
          <td>
            <div class="player">
              <div>
                <div class="h">{{ p.name }}</div>
              </div>
            </div>
          </td>
          <td class="num">{{ p.kills }}</td>
          <td class="num">{{ p.deaths }}</td>
          <td class="num">{{ p.assists }}</td>
          <td class="num">{{ kd(p) }}</td>
          <td class="num">{{ hs(p) }}%</td>
          <td class="num">{{ adr(p) }}</td>
          <td class="num">
            <div class="mk-bar">
              <span>{{ p.k2 || 0 }}</span>
              <div class="bar"><div class="fill" :style="{ width: pct(p.k2, 50) + '%' }" /></div>
            </div>
          </td>
          <td class="num">
            <div class="mk-bar">
              <span>{{ p.k3 || 0 }}</span>
              <div class="bar"><div class="fill" :style="{ width: pct(p.k3, 20) + '%' }" /></div>
            </div>
          </td>
          <td class="num">
            <div class="mk-bar">
              <span>{{ p.k4 || 0 }}</span>
              <div class="bar"><div class="fill" :style="{ width: pct(p.k4, 8) + '%' }" /></div>
            </div>
          </td>
          <td class="num">{{ p.k5 || 0 }}</td>
          <td class="num">
            <span :class="'rating-pill ' + ratingClass(p.rating)">
              {{ Number(p.rating || 0).toFixed(2) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { getTeamColor, getTeamTag, ratingClass } from "../utils/mapData.js";

const props = defineProps({
  teamName: { type: String, default: "" },
  players:  { type: Array, default: () => [] },
});

const sortKey = ref("rating");
const sortDir = ref("desc");

function onSort(k) {
  if (k === sortKey.value) sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  else { sortKey.value = k; sortDir.value = "desc"; }
}
function arr(k) {
  if (k !== sortKey.value) return "·";
  return sortDir.value === "asc" ? "▲" : "▼";
}

const sorted = computed(() => {
  const out = props.players.map(p => ({
    ...p,
    kd_val:  parseInt(p.kills) / Math.max(parseInt(p.deaths) || 1, 1),
    hs_val:  parseInt(p.kills) > 0 ? parseInt(p.headshot_kills) / parseInt(p.kills) : 0,
    adr_val: parseInt(p.roundsplayed) > 0 ? parseInt(p.damage) / parseInt(p.roundsplayed) : 0,
  }));
  const key = sortKey.value;
  const dir = sortDir.value === "asc" ? 1 : -1;
  return out.sort((a, b) => {
    const va = key === "kd" ? a.kd_val : key === "hs" ? a.hs_val : key === "adr" ? a.adr_val : (parseFloat(a[key]) || 0);
    const vb = key === "kd" ? b.kd_val : key === "hs" ? b.hs_val : key === "adr" ? b.adr_val : (parseFloat(b[key]) || 0);
    return dir * (va - vb);
  });
});

function kd(p) { return (parseInt(p.kills) / Math.max(parseInt(p.deaths) || 1, 1)).toFixed(2); }
function hs(p) { return parseInt(p.kills) > 0 ? Math.round(parseInt(p.headshot_kills) / parseInt(p.kills) * 100) : 0; }
function adr(p) { return parseInt(p.roundsplayed) > 0 ? (parseInt(p.damage) / parseInt(p.roundsplayed)).toFixed(1) : "0.0"; }
function pct(n, max) { return Math.min(100, ((parseInt(n) || 0) / max) * 100); }
</script>
