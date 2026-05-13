const axios = require("axios");
const db    = require("../db");

const BASE = "https://api.challonge.com/v1";
const TTL  = 30 * 60 * 1000; // 30 min

// slug -> { data, expiresAt }
const cache = new Map();

let cachedApiKey     = null;
let apiKeyFetchedAt  = 0;
const API_KEY_TTL    = 5 * 60 * 1000; // re-read from DB every 5 min

async function getApiKey() {
  if (cachedApiKey && Date.now() - apiKeyFetchedAt < API_KEY_TTL) return cachedApiKey;
  const [[row]] = await db.query(
    "SELECT setting_value FROM settings WHERE setting_key = 'challonge.apiKey' LIMIT 1"
  );
  cachedApiKey    = row?.setting_value ?? null;
  apiKeyFetchedAt = Date.now();
  return cachedApiKey;
}

async function get(url, apiKey) {
  const { data } = await axios.get(url, { params: { api_key: apiKey } });
  return data;
}

async function fetchTournament(slug) {
  const now = Date.now();
  const hit = cache.get(slug);
  if (hit && hit.expiresAt > now) return hit.data;

  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("challonge.apiKey introuvable dans la table settings");

  const [t, participants, matches] = await Promise.all([
    get(`${BASE}/tournaments/${slug}.json`, apiKey),
    get(`${BASE}/tournaments/${slug}/participants.json`, apiKey),
    get(`${BASE}/tournaments/${slug}/matches.json`, apiKey),
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
