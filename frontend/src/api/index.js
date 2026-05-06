import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getSeasons = () => api.get("/seasons");
export const getSeason = (id) => api.get(`/seasons/${id}`);
export const getMatch = (id) => api.get(`/matches/${id}`);
export const getTeams = () => api.get("/teams");
export const getTeam = (id, seasonId) =>
  api.get(`/teams/${id}`, { params: seasonId ? { season_id: seasonId } : {} });

export const getStats = (seasonId) =>
  api.get("/stats", { params: seasonId ? { season_id: seasonId } : {} });

export const getAdminDemosMissing = (code) =>
  api.get("/admin/demos/missing", { headers: { "x-admin-code": code } });

export const getAdminDemosBroken = (code) =>
  api.get("/admin/demos/broken", { headers: { "x-admin-code": code } });

export const getMapRounds = (mapId) => api.get(`/rounds/${mapId}`);
