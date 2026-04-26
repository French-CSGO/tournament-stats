import { createRouter, createWebHistory } from "vue-router";
import SeasonsView from "../views/SeasonsView.vue";
import SeasonView from "../views/SeasonView.vue";
import MatchView from "../views/MatchView.vue";
import TeamsView from "../views/TeamsView.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: SeasonsView },
    { path: "/season/:id", component: SeasonView },
    { path: "/match/:id", component: MatchView },
    { path: "/teams", component: TeamsView },
  ],
});
