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
              <span :class="item.rank <= 3 ? 'text-success font-weight-bold' : ''">{{ item.name }}</span>
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
// 32 teams
const teams = [
  "Magic Monkey","Julie & Cie","YUYIETTE","Horrible Squad","Grand Chien Gland","Squadra Corsa",
  "Les Fraudes","2DMAX","ArcMonkey","Jambono","Bras KC","DOGO DINGO Esport",
  "Team Alpha","Team Bravo","Team Charlie","Team Delta","Team Echo","Team Foxtrot",
  "Team Golf","Team Hotel","Team India","Team Juliet","Team Kilo","Team Lima",
  "Team Mike","Team November","Team Oscar","Team Papa","Team Quebec","Team Romeo",
  "Team Sierra","Team Tango",
];

// Round 1: 16 matches, all seeded (top vs bottom)
const swissRounds = [
  [
    { id:1,  t1:"Magic Monkey",      s1:13, t2:"Team Tango",       s2:2,  winner:1 },
    { id:2,  t1:"Julie & Cie",       s1:13, t2:"Team Sierra",      s2:5,  winner:1 },
    { id:3,  t1:"YUYIETTE",          s1:13, t2:"Team Romeo",       s2:7,  winner:1 },
    { id:4,  t1:"Horrible Squad",    s1:13, t2:"Team Quebec",      s2:4,  winner:1 },
    { id:5,  t1:"Grand Chien Gland", s1:13, t2:"Team Papa",        s2:8,  winner:1 },
    { id:6,  t1:"Squadra Corsa",     s1:13, t2:"Team Oscar",       s2:6,  winner:1 },
    { id:7,  t1:"Les Fraudes",       s1:13, t2:"Team November",    s2:3,  winner:1 },
    { id:8,  t1:"2DMAX",             s1:13, t2:"Team Mike",        s2:9,  winner:1 },
    { id:9,  t1:"ArcMonkey",         s1:13, t2:"Team Lima",        s2:5,  winner:1 },
    { id:10, t1:"Jambono",           s1:13, t2:"Team Kilo",        s2:7,  winner:1 },
    { id:11, t1:"Bras KC",           s1:7,  t2:"Team Juliet",      s2:13, winner:2 },
    { id:12, t1:"DOGO DINGO Esport", s1:4,  t2:"Team India",       s2:13, winner:2 },
    { id:13, t1:"Team Alpha",        s1:13, t2:"Team Hotel",       s2:11, winner:1 },
    { id:14, t1:"Team Bravo",        s1:9,  t2:"Team Golf",        s2:13, winner:2 },
    { id:15, t1:"Team Charlie",      s1:13, t2:"Team Foxtrot",     s2:6,  winner:1 },
    { id:16, t1:"Team Delta",        s1:13, t2:"Team Echo",        s2:10, winner:1 },
  ],
  // Round 2: 1-0 vs 1-0, 0-1 vs 0-1
  [
    { id:17, t1:"Magic Monkey",      s1:13, t2:"Julie & Cie",      s2:9,  winner:1 },
    { id:18, t1:"YUYIETTE",          s1:13, t2:"Horrible Squad",   s2:10, winner:1 },
    { id:19, t1:"Grand Chien Gland", s1:13, t2:"Squadra Corsa",    s2:8,  winner:1 },
    { id:20, t1:"Les Fraudes",       s1:13, t2:"2DMAX",            s2:6,  winner:1 },
    { id:21, t1:"ArcMonkey",         s1:13, t2:"Jambono",          s2:11, winner:1 },
    { id:22, t1:"Team India",        s1:13, t2:"Team Juliet",      s2:7,  winner:1 },
    { id:23, t1:"Team Alpha",        s1:13, t2:"Team Charlie",     s2:8,  winner:1 },
    { id:24, t1:"Team Delta",        s1:13, t2:"Team Golf",        s2:5,  winner:1 },
    // 0-1 losers bracket
    { id:25, t1:"Julie & Cie",       s1:13, t2:"Horrible Squad",   s2:7,  winner:1 },
    { id:26, t1:"Squadra Corsa",     s1:13, t2:"2DMAX",            s2:9,  winner:1 },
    { id:27, t1:"Jambono",           s1:13, t2:"Team Juliet",      s2:5,  winner:1 },
    { id:28, t1:"Team Charlie",      s1:13, t2:"Team Golf",        s2:10, winner:1 },
    { id:29, t1:"Bras KC",           s1:4,  t2:"DOGO DINGO Esport",s2:13, winner:2 },
    { id:30, t1:"Team Bravo",        s1:13, t2:"Team Foxtrot",     s2:6,  winner:1 },
    { id:31, t1:"Team Hotel",        s1:7,  t2:"Team Romeo",       s2:13, winner:2 },
    { id:32, t1:"Team Sierra",       s1:13, t2:"Team Tango",       s2:4,  winner:1 },
  ],
  // Round 3: 2-0 vs 2-0, 1-1 vs 1-1, 0-2 vs 0-2
  [
    { id:33, t1:"Magic Monkey",      s1:13, t2:"YUYIETTE",         s2:6,  winner:1 },
    { id:34, t1:"Grand Chien Gland", s1:13, t2:"Les Fraudes",      s2:11, winner:1 },
    { id:35, t1:"ArcMonkey",         s1:13, t2:"Team India",       s2:8,  winner:1 },
    { id:36, t1:"Team Alpha",        s1:13, t2:"Team Delta",       s2:10, winner:1 },
    // 1-1 bracket (16 teams)
    { id:37, t1:"Julie & Cie",       s1:13, t2:"Squadra Corsa",    s2:7,  winner:1 },
    { id:38, t1:"Horrible Squad",    s1:13, t2:"2DMAX",            s2:5,  winner:1 },
    { id:39, t1:"Jambono",           s1:13, t2:"Team Charlie",     s2:9,  winner:1 },
    { id:40, t1:"Team Bravo",        s1:13, t2:"Team Delta",       s2:8,  winner:1 },
    { id:41, t1:"YUYIETTE",          s1:13, t2:"Team India",       s2:4,  winner:1 },
    { id:42, t1:"Les Fraudes",       s1:7,  t2:"Team Alpha",       s2:13, winner:2 },
    { id:43, t1:"2DMAX",             s1:13, t2:"Squadra Corsa",    s2:10, winner:1 },
    { id:44, t1:"Team Charlie",      s1:13, t2:"Jambono",          s2:6,  winner:1 },
    // 0-2 → eliminated
    { id:45, t1:"DOGO DINGO Esport", s1:13, t2:"Bras KC",          s2:5,  winner:1 },
    { id:46, t1:"Team Romeo",        s1:13, t2:"Team Sierra",      s2:8,  winner:1 },
    { id:47, t1:"Team Hotel",        s1:13, t2:"Team Foxtrot",     s2:4,  winner:1 },
    { id:48, t1:"Team Tango",        s1:7,  t2:"Team Quebec",      s2:13, winner:2 },
  ],
  // Round 4: 3-0 → qualified, 2-1 vs 2-1, 1-2 vs 1-2, 0-3 → eliminated
  [
    // 3-0 matches (→ directly qualified)
    { id:49, t1:"Magic Monkey",      s1:13, t2:"Grand Chien Gland",s2:5,  winner:1 },
    { id:50, t1:"ArcMonkey",         s1:9,  t2:"Team Alpha",       s2:13, winner:2 },
    // 2-1 bracket (12 teams)
    { id:51, t1:"Julie & Cie",       s1:13, t2:"YUYIETTE",         s2:11, winner:1 },
    { id:52, t1:"Horrible Squad",    s1:13, t2:"2DMAX",            s2:7,  winner:1 },
    { id:53, t1:"Jambono",           s1:13, t2:"Team Charlie",     s2:6,  winner:1 },
    { id:54, t1:"Team Bravo",        s1:13, t2:"Team Alpha",       s2:9,  winner:1 },
    { id:55, t1:"Grand Chien Gland", s1:13, t2:"Les Fraudes",      s2:8,  winner:1 },
    { id:56, t1:"ArcMonkey",         s1:13, t2:"Squadra Corsa",    s2:5,  winner:1 },
    // 1-2 bracket (→ last chance)
    { id:57, t1:"DOGO DINGO Esport", s1:13, t2:"Team Romeo",       s2:6,  winner:1 },
    { id:58, t1:"Team Quebec",       s1:13, t2:"Team Hotel",       s2:7,  winner:1 },
    { id:59, t1:"Team Sierra",       s1:4,  t2:"Team Foxtrot",     s2:13, winner:2 },
    { id:60, t1:"Team Oscar",        s1:13, t2:"Team November",    s2:8,  winner:1 },
    { id:61, t1:"Team Mike",         s1:13, t2:"Team Kilo",        s2:9,  winner:1 },
    { id:62, t1:"Team Lima",         s1:7,  t2:"Team Papa",        s2:13, winner:2 },
    // 0-3 → eliminated (listed for completeness)
    { id:63, t1:"Team Tango",        s1:3,  t2:"Team Golf",        s2:13, winner:2 },
    { id:64, t1:"Bras KC",           s1:5,  t2:"Team Echo",        s2:13, winner:2 },
  ],
  // Round 5: decisive round — 3-1 qualified, 2-2 last chance, 1-3 eliminated
  [
    { id:65, t1:"Julie & Cie",       s1:13, t2:"Horrible Squad",   s2:9,  winner:1 },
    { id:66, t1:"Jambono",           s1:7,  t2:"Team Bravo",       s2:13, winner:2 },
    { id:67, t1:"Grand Chien Gland", s1:13, t2:"ArcMonkey",        s2:10, winner:1 },
    { id:68, t1:"YUYIETTE",          s1:13, t2:"2DMAX",            s2:4,  winner:1 },
    { id:69, t1:"Les Fraudes",       s1:13, t2:"Squadra Corsa",    s2:8,  winner:1 },
    { id:70, t1:"Team Charlie",      s1:11, t2:"Team Alpha",       s2:13, winner:2 },
    // 2-2 last chance
    { id:71, t1:"DOGO DINGO Esport", s1:9,  t2:"Team Quebec",      s2:13, winner:2 },
    { id:72, t1:"Team Foxtrot",      s1:13, t2:"Team Oscar",       s2:6,  winner:1 },
    { id:73, t1:"Team Mike",         s1:13, t2:"Team Papa",        s2:7,  winner:1 },
    { id:74, t1:"Team Hotel",        s1:13, t2:"Team Romeo",       s2:5,  winner:1 },
    { id:75, t1:"Team Kilo",         s1:7,  t2:"Team November",    s2:13, winner:2 },
    { id:76, t1:"Team India",        s1:13, t2:"Team Sierra",      s2:9,  winner:1 },
    // 1-3 → eliminated
    { id:77, t1:"Team Golf",         s1:4,  t2:"Team Echo",        s2:13, winner:2 },
    { id:78, t1:"Team Lima",         s1:13, t2:"Team Bravo",       s2:6,  winner:1 },
    { id:79, t1:"Team Tango",        s1:8,  t2:"Team Delta",       s2:13, winner:2 },
    { id:80, t1:"Team Oscar",        s1:13, t2:"Team Foxtrot",     s2:4,  winner:1 },
  ],
];

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
  { rank:32, name:"Team Hotel",        wins:0, losses:3, pts:0 },
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
