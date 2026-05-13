<template>
  <div>
    <div class="d-flex align-center mb-4 gap-2">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <span class="text-caption text-medium-emphasis">Prévisualisation Swiss</span>
    </div>

    <div class="d-flex align-center gap-3 mb-5">
      <div>
        <h1 class="text-h5">Ezlan 2026 — Swiss</h1>
        <div class="text-caption text-medium-emphasis mt-1">
          Swiss · 12 participants
        </div>
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="5">
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
              <span :class="item.rank === 1 ? 'text-success font-weight-bold' : ''">{{ item.name }}</span>
            </template>
            <template #item.pts="{ item }">
              <span class="font-weight-bold">{{ item.pts }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" md="7">
        <v-card color="surface">
          <v-card-title class="text-subtitle-1">Rounds</v-card-title>
          <v-expansion-panels variant="accordion" flat>
            <v-expansion-panel
              v-for="(round, ri) in swissRounds"
              :key="ri"
              :title="`Round ${ri + 1}`"
              color="surface"
            >
              <template #text>
                <div class="round-matches-grid">
                  <div v-for="m in round" :key="m.id" class="match-card">
                    <div class="match-side" :class="{ winner: m.winner === 1, loser: m.winner === 2 }">
                      <span class="match-name text-body-2">{{ m.t1 }}</span>
                      <v-chip size="x-small" :color="m.winner === 1 ? 'success' : m.winner === 2 ? 'error' : 'default'" variant="flat" class="match-score">{{ m.s1 }}</v-chip>
                    </div>
                    <div class="match-sep" />
                    <div class="match-side" :class="{ winner: m.winner === 2, loser: m.winner === 1 }">
                      <span class="match-name text-body-2">{{ m.t2 }}</span>
                      <v-chip size="x-small" :color="m.winner === 2 ? 'success' : m.winner === 1 ? 'error' : 'default'" variant="flat" class="match-score">{{ m.s2 }}</v-chip>
                    </div>
                  </div>
                </div>
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
const teams = ["Magic Monkey","Julie & Cie","YUYIETTE","Horrible Squad","Grand Chien","Squadra","Les Fraudes","2DMAX","ArcMonkey","Jambono","Bras KC","DOGO DINGO"];

const swissRounds = [
  [
    { id:1,  t1:"Magic Monkey",   s1:13, t2:"2DMAX",          s2:5,  winner:1 },
    { id:2,  t1:"Julie & Cie",    s1:13, t2:"Squadra",        s2:4,  winner:1 },
    { id:3,  t1:"YUYIETTE",       s1:13, t2:"DOGO DINGO",     s2:0,  winner:1 },
    { id:4,  t1:"Horrible Squad", s1:13, t2:"Jambono",        s2:11, winner:1 },
    { id:5,  t1:"Grand Chien",    s1:13, t2:"Bras KC",        s2:4,  winner:1 },
    { id:6,  t1:"ArcMonkey",      s1:13, t2:"Les Fraudes",    s2:7,  winner:1 },
  ],
  [
    { id:7,  t1:"Magic Monkey",   s1:13, t2:"Julie & Cie",    s2:9,  winner:1 },
    { id:8,  t1:"YUYIETTE",       s1:13, t2:"Horrible Squad", s2:10, winner:1 },
    { id:9,  t1:"Grand Chien",    s1:13, t2:"ArcMonkey",      s2:6,  winner:1 },
    { id:10, t1:"2DMAX",          s1:13, t2:"Squadra",        s2:8,  winner:1 },
    { id:11, t1:"Jambono",        s1:13, t2:"DOGO DINGO",     s2:3,  winner:1 },
    { id:12, t1:"Les Fraudes",    s1:13, t2:"Bras KC",        s2:5,  winner:1 },
  ],
  [
    { id:13, t1:"Magic Monkey",   s1:13, t2:"YUYIETTE",       s2:8,  winner:1 },
    { id:14, t1:"Julie & Cie",    s1:13, t2:"Grand Chien",    s2:7,  winner:1 },
    { id:15, t1:"Horrible Squad", s1:13, t2:"2DMAX",          s2:3,  winner:1 },
    { id:16, t1:"ArcMonkey",      s1:12, t2:"Jambono",        s2:12, winner:0 },
    { id:17, t1:"Squadra",        s1:13, t2:"Les Fraudes",    s2:10, winner:1 },
    { id:18, t1:"DOGO DINGO",     s1:4,  t2:"Bras KC",        s2:13, winner:2 },
  ],
];

const standings = [
  { rank:1,  name:"Magic Monkey",   wins:3, losses:0, pts:3 },
  { rank:2,  name:"Julie & Cie",    wins:2, losses:1, pts:2 },
  { rank:3,  name:"YUYIETTE",       wins:2, losses:1, pts:2 },
  { rank:4,  name:"Horrible Squad", wins:2, losses:1, pts:2 },
  { rank:5,  name:"Grand Chien",    wins:2, losses:1, pts:2 },
  { rank:6,  name:"Squadra",        wins:1, losses:2, pts:1 },
  { rank:7,  name:"ArcMonkey",      wins:1, losses:1, pts:1 },
  { rank:8,  name:"2DMAX",          wins:1, losses:2, pts:1 },
  { rank:9,  name:"Les Fraudes",    wins:1, losses:2, pts:1 },
  { rank:10, name:"Jambono",        wins:1, losses:1, pts:1 },
  { rank:11, name:"Bras KC",        wins:1, losses:2, pts:1 },
  { rank:12, name:"DOGO DINGO",     wins:0, losses:3, pts:0 },
];

const standingsHeaders = [
  { title:"#",      key:"rank",   sortable:false },
  { title:"Équipe", key:"name",   sortable:false },
  { title:"V",      key:"wins",   sortable:false },
  { title:"D",      key:"losses", sortable:false },
  { title:"Pts",    key:"pts",    sortable:false },
];
</script>

<style scoped>
.round-matches-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 4px 0;
}
@media (max-width: 600px) {
  .round-matches-grid { grid-template-columns: 1fr; }
}
.match-card {
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  overflow: hidden;
  background: #252e3d;
}
.match-side {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
}
.match-side.loser .match-name { opacity: 0.45; }
.match-side.winner .match-name { font-weight: 600; }
.match-name { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.match-score { flex-shrink: 0; }
.match-sep { height: 1px; background: rgba(255,255,255,0.08); }
</style>
