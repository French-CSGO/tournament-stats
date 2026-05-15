<template>
  <div>
    <div class="d-flex align-center mb-4 gap-2">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <span class="text-caption text-medium-emphasis">Prévisualisation Swiss</span>
    </div>

    <div class="d-flex align-center gap-3 mb-5">
      <div>
        <h1 class="text-h5">Ezlan 2026 — Swiss</h1>
        <div class="text-caption text-medium-emphasis mt-1">Swiss · 32 participants</div>
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="4">
        <v-card color="surface">
          <v-card-title class="text-subtitle-1">Classement</v-card-title>
          <v-data-table
            :headers="standingsHeaders"
            :items="standings"
            density="compact"
            :items-per-page="-1"
            hide-default-footer
          >
            <template #item.rank="{ item }">
              <span class="text-medium-emphasis">{{ item.rank }}</span>
            </template>
            <template #item.name="{ item }">
              <span :class="item.rank <= 3 ? 'text-success font-weight-bold' : ''">{{ item.name }}</span>
            </template>
            <template #item.pts="{ item }">
              <span class="font-weight-bold">{{ item.pts }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card color="surface" class="pa-4">
          <div class="text-subtitle-1 mb-3">Bracket</div>
          <SwissBracket :matches="mockMatches" :participants="mockParticipants" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import SwissBracket from "../components/SwissBracket.vue";

// ─── Mock participants (32 teams) ─────────────────────────────────────────────
const names = [
  "Magic Monkey","Julie & Cie","YUYIETTE","Horrible Squad","Grand Chien Gland","Squadra Corsa",
  "Les Fraudes","2DMAX","ArcMonkey","Jambono","Bras KC","DOGO DINGO Esport",
  "Team Alpha","Team Bravo","Team Charlie","Team Delta","Team Echo","Team Foxtrot",
  "Team Golf","Team Hotel","Team India","Team Juliet","Team Kilo","Team Lima",
  "Team Mike","Team November","Team Oscar","Team Papa","Team Quebec","Team Romeo",
  "Team Sierra","Team Tango",
];
const mockParticipants = names.map((name, i) => ({ id: i + 1, name }));

// Helper: build a match object in Challonge format
let _mid = 1;
function match(round, p1, p2, s1, s2) {
  const id = _mid++;
  const winner_id = s1 > s2 ? p1 : s2 > s1 ? p2 : null;
  return { id, round, player1_id: p1, player2_id: p2, winner_id, scores_csv: `${s1}-${s2}` };
}

// ─── Round 1 (all 0-0) ────────────────────────────────────────────────────────
const r1 = [
  match(1, 1,  32, 13, 2),  match(1, 2,  31, 13, 5),
  match(1, 3,  30, 13, 7),  match(1, 4,  29, 13, 4),
  match(1, 5,  28, 13, 8),  match(1, 6,  27, 13, 6),
  match(1, 7,  26, 13, 3),  match(1, 8,  25, 13, 9),
  match(1, 9,  24, 13, 5),  match(1, 10, 23, 13, 7),
  match(1, 11, 22,  7,13),  match(1, 12, 21,  4,13),
  match(1, 13, 20, 13,11),  match(1, 14, 19,  9,13),
  match(1, 15, 18, 13, 6),  match(1, 16, 17, 13,10),
];

// ─── Round 2 (1-0 vs 1-0, 0-1 vs 0-1) ───────────────────────────────────────
const r2 = [
  match(2, 1,  2, 13, 9),  match(2, 3,  5, 13, 8),
  match(2, 7,  6, 13, 8),  match(2, 8, 10, 13, 6),
  match(2, 9, 13, 13,11),  match(2, 15,16, 13, 5),
  match(2, 4, 12, 13, 7),  match(2, 11,14, 13, 8), // 0-1 bracket
  match(2, 22,32,  4,13),  match(2, 21,31, 13, 7),
  match(2, 23,30, 13, 8),  match(2, 24,29,  6,13),
  match(2, 25,28, 13, 5),  match(2, 26,27, 13, 4),
  match(2, 18,20, 13, 6),  match(2, 17,19,  8,13),
];

// ─── Round 3 (2-0, 1-1, 0-2) ─────────────────────────────────────────────────
const r3 = [
  match(3, 1,  3, 13, 6),  match(3, 7,  8, 13, 5),  // 2-0
  match(3, 9, 15, 13, 8),  match(3, 13,16, 13,10),
  match(3, 2,  6, 13, 7),  match(3, 5, 10, 13, 8),  // 1-1
  match(3, 4, 11, 13, 9),  match(3, 12,14, 13, 6),
  match(3, 3, 21, 13, 4),  match(3, 6, 22,  8,13),  // extra 1-1
  match(3, 32,31, 13, 8),  match(3, 30,29,  4,13),  // 0-2
  match(3, 27,28, 13, 5),  match(3, 26,25,  3,13),
  match(3, 20,19, 13, 6),  match(3, 18,17, 13, 7),
];

// ─── Round 4 (3-0, 2-1, 1-2, 0-3) ────────────────────────────────────────────
const r4 = [
  match(4, 1,  7, 13, 5),  match(4, 9, 13, 9,13),  // 3-0
  match(4, 8, 15, 13, 7),  match(4, 16, 3, 13, 8), // 3-0 pool
  match(4, 2,  5, 13,11),  match(4, 4, 12, 13, 7), // 2-1
  match(4, 11,14,  7,13),  match(4, 10, 6, 13, 9),
  match(4, 32,21, 13, 6),  match(4, 29,30, 13, 8), // 1-2
  match(4, 25,27, 13, 4),  match(4, 22,23, 7,13),
  match(4, 19,20, 13, 5),  match(4, 17,18,  6,13),
  match(4, 28,31,  3,13),  match(4, 26,24,  4,13),
];

// ─── Round 5 (decisive) ───────────────────────────────────────────────────────
const r5 = [
  match(5, 1,  2, 13, 9),  match(5, 13,16, 13, 7), // 4-0 / 3-1
  match(5, 8, 15, 11,13),  match(5, 4, 10, 13, 8),
  match(5, 5, 12, 13, 6),  match(5, 14, 3, 13,10),
  match(5, 6, 11, 13, 7),  match(5, 9,  7,  8,13),
  match(5, 32,29, 13, 5),  match(5, 23,30,  6,13), // 2-2 last chance
  match(5, 25,19, 13, 7),  match(5, 26,17, 13, 8),
  match(5, 31,22, 13, 4),  match(5, 24,28,  7,13),
  match(5, 20,27, 13, 3),  match(5, 18,21,  5,13),
];

const mockMatches = [...r1, ...r2, ...r3, ...r4, ...r5];

// ─── Standings ────────────────────────────────────────────────────────────────
const standings = [
  { rank:1,  name:"Magic Monkey",      wins:5, losses:0, pts:5 },
  { rank:2,  name:"Team Alpha",        wins:4, losses:1, pts:4 },
  { rank:3,  name:"Julie & Cie",       wins:4, losses:1, pts:4 },
  { rank:4,  name:"Grand Chien Gland", wins:4, losses:1, pts:4 },
  { rank:5,  name:"YUYIETTE",          wins:4, losses:1, pts:4 },
  { rank:6,  name:"Les Fraudes",       wins:4, losses:1, pts:4 },
  { rank:7,  name:"Team Bravo",        wins:4, losses:1, pts:4 },
  { rank:8,  name:"Team Quebec",       wins:3, losses:2, pts:3 },
  { rank:9,  name:"Horrible Squad",    wins:3, losses:2, pts:3 },
  { rank:10, name:"Team Foxtrot",      wins:3, losses:2, pts:3 },
  { rank:11, name:"Team Mike",         wins:3, losses:2, pts:3 },
  { rank:12, name:"Team Hotel",        wins:3, losses:2, pts:3 },
  { rank:13, name:"Team November",     wins:3, losses:2, pts:3 },
  { rank:14, name:"Team India",        wins:3, losses:2, pts:3 },
  { rank:15, name:"ArcMonkey",         wins:3, losses:2, pts:3 },
  { rank:16, name:"Jambono",           wins:2, losses:3, pts:2 },
  { rank:17, name:"2DMAX",             wins:2, losses:3, pts:2 },
  { rank:18, name:"Squadra Corsa",     wins:2, losses:3, pts:2 },
  { rank:19, name:"Team Charlie",      wins:2, losses:3, pts:2 },
  { rank:20, name:"DOGO DINGO Esport", wins:2, losses:3, pts:2 },
  { rank:21, name:"Team Lima",         wins:2, losses:3, pts:2 },
  { rank:22, name:"Team Delta",        wins:2, losses:3, pts:2 },
  { rank:23, name:"Team Echo",         wins:2, losses:3, pts:2 },
  { rank:24, name:"Team Oscar",        wins:2, losses:3, pts:2 },
  { rank:25, name:"Team Romeo",        wins:1, losses:4, pts:1 },
  { rank:26, name:"Team Sierra",       wins:1, losses:4, pts:1 },
  { rank:27, name:"Team Kilo",         wins:1, losses:4, pts:1 },
  { rank:28, name:"Team Golf",         wins:1, losses:4, pts:1 },
  { rank:29, name:"Team Papa",         wins:1, losses:4, pts:1 },
  { rank:30, name:"Bras KC",           wins:0, losses:3, pts:0 },
  { rank:31, name:"Team Tango",        wins:0, losses:4, pts:0 },
  { rank:32, name:"Team Foxtrot",      wins:0, losses:3, pts:0 },
];

const standingsHeaders = [
  { title:"#",      key:"rank",   sortable:false },
  { title:"Équipe", key:"name",   sortable:false },
  { title:"V",      key:"wins",   sortable:false },
  { title:"D",      key:"losses", sortable:false },
  { title:"Pts",    key:"pts",    sortable:false },
];
</script>
