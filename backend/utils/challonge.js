const https  = require("https");
const db     = require("../db");

const BASE = "https://api.challonge.com/v1";
const TTL  = 30 * 60 * 1000; // 30 min

const cache = new Map(); // slug -> { data, expiresAt }

let cachedApiKey    = null;
let apiKeyFetchedAt = 0;
const API_KEY_TTL   = 5 * 60 * 1000;

async function getApiKey() {
  if (cachedApiKey && Date.now() - apiKeyFetchedAt < API_KEY_TTL) return cachedApiKey;
  const [[row]] = await db.query(
    "SELECT setting_value FROM settings WHERE setting_key = 'challonge.apiKey' LIMIT 1"
  );
  cachedApiKey    = row?.setting_value ?? null;
  apiKeyFetchedAt = Date.now();
  return cachedApiKey;
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 401) return reject(Object.assign(new Error("Unauthorized"), { response: { status: 401 } }));
      if (res.statusCode === 404) return reject(Object.assign(new Error("Not found"), { response: { status: 404 } }));
      if (res.statusCode >= 400) return reject(Object.assign(new Error(`HTTP ${res.statusCode}`), { response: { status: res.statusCode } }));
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function fetchTournament(slug) {
  const now = Date.now();
  const hit = cache.get(slug);
  if (hit && hit.expiresAt > now) return hit.data;

  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("challonge.apiKey introuvable dans la table settings");

  const qs = `?api_key=${encodeURIComponent(apiKey)}`;
  const [t, participants, matches] = await Promise.all([
    httpGet(`${BASE}/tournaments/${slug}.json${qs}`),
    httpGet(`${BASE}/tournaments/${slug}/participants.json${qs}`),
    httpGet(`${BASE}/tournaments/${slug}/matches.json${qs}`),
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
