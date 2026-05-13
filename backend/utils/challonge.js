const axios = require("axios");

const BASE = "https://api.challonge.com/v1";
const TTL  = 30 * 60 * 1000; // 30 min

// slug -> { data, expiresAt }
const cache = new Map();

async function get(url) {
  const { data } = await axios.get(url, { params: { api_key: process.env.CHALLONGE_API_KEY } });
  return data;
}

async function fetchTournament(slug) {
  const now = Date.now();
  const hit = cache.get(slug);
  if (hit && hit.expiresAt > now) return hit.data;

  const [t, participants, matches] = await Promise.all([
    get(`${BASE}/tournaments/${slug}.json`),
    get(`${BASE}/tournaments/${slug}/participants.json`),
    get(`${BASE}/tournaments/${slug}/matches.json`),
  ]);

  const data = {
    tournament:   t.tournament,
    participants: participants.map((p) => p.participant),
    matches:      matches.map((m) => m.match),
  };

  cache.set(slug, { data, expiresAt: now + TTL });
  return data;
}

function clearCache(slug) {
  slug ? cache.delete(slug) : cache.clear();
}

module.exports = { fetchTournament, clearCache };
