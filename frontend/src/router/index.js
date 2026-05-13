import { createRouter, createWebHistory } from "vue-router";
import SeasonsView  from "../views/SeasonsView.vue";
import SeasonView   from "../views/SeasonView.vue";
import MatchView    from "../views/MatchView.vue";
import TeamsView    from "../views/TeamsView.vue";
import StatsView    from "../views/StatsView.vue";
import AdminView        from "../views/AdminView.vue";
import TournamentView  from "../views/TournamentView.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/",             component: SeasonsView },
    { path: "/season/:id",   component: SeasonView },
    { path: "/season/:seasonId/tournaments",          component: TournamentView },
    { path: "/season/:seasonId/tournaments/:slug",    component: TournamentView },
    { path: "/match/:id",    component: MatchView },
    { path: "/teams",          component: TeamsView },
    { path: "/teams/:id",      component: TeamsView },
    { path: "/stats",              component: StatsView },
    { path: "/stats/season/:id",   component: StatsView },
    { path: "/admin",        component: AdminView },
  ],
});
