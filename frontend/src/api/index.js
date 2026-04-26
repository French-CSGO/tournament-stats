import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getSeasons = () => api.get("/seasons");
export const getSeason = (id) => api.get(`/seasons/${id}`);
export const getMatch = (id) => api.get(`/matches/${id}`);
export const getTeams = () => api.get("/teams");
export const getTeam = (id, seasonId) =>
  api.get(`/teams/${id}`, { params: seasonId ? { season_id: seasonId } : {} });
