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
            <span>TOURNAMENT STATS · <b>CS2 / CS:GO</b> · POWERED BY GET5</span>
            <span>·</span>
            <span>TOURNAMENT STATS · <b>CS2 / CS:GO</b> · POWERED BY GET5</span>
            <span>·</span>
          </div>
        </span>
        <span class="nav">
          <router-link to="/" class="nav-link" :class="{ on: isHub }">HUB</router-link>
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
onMounted(() => { tick(); timer = setInterval(tick, 1000); });
onUnmounted(() => clearInterval(timer));
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
