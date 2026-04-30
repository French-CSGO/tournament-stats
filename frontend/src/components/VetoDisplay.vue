<template>
  <div class="veto-display">
    <div class="veto-row">
      <div v-for="card in cards" :key="card.id" class="map-card-wrapper">
        <div
          :class="['map-card', card.state, { decider: card.isDecider }]"
        >
          <img class="map-bg" :src="mapImg(card.map)" @error="imgFallback" />
          <div v-if="card.state === 'ban'" class="ban-overlay" />
          <div class="card-footer">
            <div class="action-badge" :class="card.state">
              {{ actionLabel(card) }}
            </div>
            <div class="map-name" :class="{ 'map-name--ban': card.state === 'ban' }">
              {{ formatMapName(card.map) }}
            </div>
            <div v-if="card.team_name && !card.isDecider" class="team-name">
              {{ card.team_name }}
            </div>
            <div v-if="card.state === 'pick' && card.side && card.side !== 'none'" class="side-name">
              {{ card.side_team }} {{ card.side.toUpperCase() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const MAP_NAMES = {
  de_dust2: "Dust 2", de_mirage: "Mirage", de_inferno: "Inferno",
  de_nuke: "Nuke", de_overpass: "Overpass", de_anubis: "Anubis",
  de_ancient: "Ancient", de_vertigo: "Vertigo", de_cache: "Cache",
  de_train: "Train", de_cbble: "Cobblestone", de_tuscan: "Tuscan",
  de_basalt: "Basalt", cs_office: "Office", cs_agency: "Agency",
};

const props = defineProps({
  vetos: { type: Array, default: () => [] },
});

const cards = props.vetos.map(v => ({
  id: v.id,
  map: v.map,
  state: v.pick_or_veto === "pick" ? "pick" : v.pick_or_veto === "decider" ? "pick" : "ban",
  isDecider: v.team_name === "Decider" || v.pick_or_veto === "decider",
  team_name: v.team_name === "Decider" ? null : v.team_name,
  side: v.side ?? null,
  side_team: v.side_team ?? null,
}));

const mapImg = (map) => `/img/maps/${map}.jpg`;
const imgFallback = (e) => { e.target.src = `/img/maps/_unknown.jpg`; };

const formatMapName = (map) =>
  MAP_NAMES[map] ||
  map.replace(/^(de_|cs_|ar_)/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const actionLabel = (card) => {
  if (card.isDecider) return "DECIDER";
  return card.state === "ban" ? "BAN" : "PICK";
};
</script>

<style scoped>
.veto-display { width: 100%; padding: 12px 0; }

.veto-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}

.map-card-wrapper {
  flex: 1 1 calc(100% / 7 - 8px);
  max-width: calc(100% / 7 - 8px);
  min-width: 90px;
}

.map-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  height: 140px;
  border: 2px solid rgba(255,255,255,0.15);
  background: #1a1a1a;
}

.map-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ban-overlay {
  position: absolute;
  inset: 0;
  background: rgba(200,10,10,0.4);
  z-index: 1;
}

.card-footer {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.88));
  padding: 20px 6px 6px;
  z-index: 2;
  text-align: center;
  line-height: 1.3;
}

.action-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 2px;
}
.action-badge.ban  { color: #ff6b6b; }
.action-badge.pick { color: #69db7c; }

.map-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.map-name--ban { color: #aaa; text-decoration: line-through; }

.team-name {
  font-size: 11px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-name {
  font-size: 11px;
  color: #aaa;
  font-style: italic;
}

.map-card.ban  { border-color: #e53935; box-shadow: 0 0 0 2px #e53935, 0 0 18px 4px rgba(229,57,53,0.5); }
.map-card.pick { border-color: #43a047; box-shadow: 0 0 0 2px #43a047, 0 0 18px 4px rgba(67,160,71,0.5); }
.map-card.pick.decider { border-color: #fb8c00; box-shadow: 0 0 0 2px #fb8c00, 0 0 18px 4px rgba(251,140,0,0.5); }
</style>
