const { Router } = require("express");
const db = require("../db");

const router = Router();

const KNIFE_PATTERNS = ["knife","bayonet","karambit","butterfly","falchion","flip","gut","huntsman","m9","navaja","shadow","stiletto","talon","ursus","daggers","paracord","survival","nomad","skeleton","cord","css"];
const WEAPON_LABELS = {
  ak47:"AK-47",awp:"AWP",m4a1:"M4A1-S",m4a1_silencer:"M4A1-S",m4a4:"M4A4",
  deagle:"Desert Eagle",sg553:"SG 553",aug:"AUG",famas:"FAMAS",galil:"Galil AR",
  mp9:"MP9",mac10:"MAC-10",ump45:"UMP-45",p90:"P90",mp5sd:"MP5-SD",mp7:"MP7",
  bizon:"PP-Bizon",tec9:"Tec-9",cz75a:"CZ75",fiveseven:"Five-SeveN",
  glock:"Glock-18",hkp2000:"P2000",usp_silencer:"USP-S",p250:"P250",
  revolver:"R8",hegrenade:"HE",molotov:"Molotov",incgrenade:"Incendiary",
  flashbang:"Flashbang",smokegrenade:"Smoke",
};
const WEAPON_COLORS = {
  ak47:"#ef4444",awp:"#f59e0b",m4a1:"#3b82f6",m4a1_silencer:"#3b82f6",m4a4:"#8b5cf6",
  deagle:"#ec4899",sg553:"#06b6d4",aug:"#10b981",
};

function weaponLabel(key) {
  if (WEAPON_LABELS[key]) return WEAPON_LABELS[key];
  if (KNIFE_PATTERNS.some(p => key.includes(p))) return "Knife";
  return null;
}

// GET /api/stats?season_id=X (optionnel)
router.get("/", async (req, res) => {
  const seasonId = req.query.season_id ? parseInt(req.query.season_id) : null;
  const seasonFilter = seasonId ? "AND m.season_id = ?" : "";
  const params = seasonId ? [seasonId] : [];

  try {
    // KPIs
    const [[kpis]] = await db.query(`
      SELECT
        COUNT(DISTINCT m.id)    AS total_matches,
        COUNT(DISTINCT ms.id)   AS maps_played,
        SUM(ps.kills)           AS total_kills,
        SUM(ps.damage)          AS total_damage,
        SUM(ps.roundsplayed)    AS total_rounds
      FROM \`match\` m
      LEFT JOIN map_stats ms   ON ms.match_id = m.id AND ms.end_time IS NOT NULL
      LEFT JOIN player_stats ps ON ps.map_id = ms.id
      WHERE m.cancelled = 0 ${seasonFilter}
    `, params);

    // Top players
    const [rawPlayers] = await db.query(`
      SELECT *,
        ROUND((
          (kills/rounds)/0.679
          + 0.7*(rounds-deaths)/rounds/0.317
          + (k1+4*k2+9*k3+16*k4+25*k5)/rounds/1.277
        )/2.7, 2) AS rating
      FROM (
        SELECT
          ps.steam_id,
          MAX(ps.name)           AS name,
          MAX(t.name)            AS team,
          SUM(ps.kills)          AS kills,
          SUM(ps.deaths)         AS deaths,
          SUM(ps.assists)        AS assists,
          SUM(ps.headshot_kills) AS headshot_kills,
          SUM(ps.damage)         AS damage,
          SUM(ps.roundsplayed)   AS rounds,
          COUNT(DISTINCT ms.id)  AS maps,
          SUM(ps.k1) AS k1, SUM(ps.k2) AS k2, SUM(ps.k3) AS k3,
          SUM(ps.k4) AS k4, SUM(ps.k5) AS k5
        FROM player_stats ps
        JOIN map_stats ms ON ms.id = ps.map_id
        JOIN \`match\` m   ON m.id = ms.match_id
        LEFT JOIN team t   ON t.id = ps.team_id
        WHERE m.cancelled = 0 AND ps.roundsplayed > 0 ${seasonFilter}
        GROUP BY ps.steam_id
        HAVING SUM(ps.roundsplayed) >= 10
      ) agg
      ORDER BY rating DESC
    `, params);

    // Weapon fav per player
    let favWeapon = {};
    try {
      const [wRows] = await db.query(`
        SELECT pse.attacker_steam_id AS steam_id, pse.weapon, COUNT(*) AS kills
        FROM player_stat_extras pse
        JOIN map_stats ms ON ms.id = pse.map_id
        JOIN \`match\` m   ON m.id = ms.match_id
        WHERE m.cancelled = 0 AND pse.suicide = 0 AND pse.friendly_fire = 0
          AND pse.attacker_steam_id IS NOT NULL ${seasonFilter}
        GROUP BY pse.attacker_steam_id, pse.weapon
        ORDER BY kills DESC
      `, params);
      for (const w of wRows) {
        if (!favWeapon[w.steam_id]) {
          favWeapon[w.steam_id] = {
            weapon: WEAPON_LABELS[w.weapon.toLowerCase()] || w.weapon,
            kills: parseInt(w.kills),
          };
        }
      }
    } catch (_) {}

    // Map CT/T stats
    const [mapStats] = await db.query(`
      SELECT ms.map_name,
        SUM(ms.team1_score_ct + ms.team2_score_ct) AS ct_wins,
        SUM(ms.team1_score_t  + ms.team2_score_t)  AS t_wins,
        COUNT(*) AS played
      FROM map_stats ms
      JOIN \`match\` m ON m.id = ms.match_id
      WHERE m.cancelled = 0 AND ms.end_time IS NOT NULL ${seasonFilter}
      GROUP BY ms.map_name
      ORDER BY played DESC
      LIMIT 8
    `, params);

    // Weapon totals
    let weaponData = [];
    try {
      const [wTotals] = await db.query(`
        SELECT pse.weapon, COUNT(*) AS kills
        FROM player_stat_extras pse
        JOIN map_stats ms ON ms.id = pse.map_id
        JOIN \`match\` m   ON m.id = ms.match_id
        WHERE m.cancelled = 0 AND pse.suicide = 0 AND pse.friendly_fire = 0
          AND pse.attacker_steam_id IS NOT NULL ${seasonFilter}
        GROUP BY pse.weapon
        ORDER BY kills DESC
      `, params);

      const buckets = {};
      const totalWK = wTotals.reduce((s, w) => s + parseInt(w.kills), 0);
      for (const w of wTotals) {
        const key   = w.weapon.toLowerCase();
        const label = weaponLabel(key) || "Other";
        const color = WEAPON_COLORS[key] || (label === "Knife" ? "#a78bfa" : "#6b7280");
        if (!buckets[label]) buckets[label] = { kills: 0, color };
        buckets[label].kills += parseInt(w.kills);
      }
      const sorted = Object.entries(buckets)
        .map(([weapon, { kills, color }]) => ({ weapon, kills, color }))
        .sort((a, b) => b.kills - a.kills);
      const top9 = sorted.slice(0, 9);
      const rest  = sorted.slice(9).reduce((s, w) => s + w.kills, 0);
      if (rest > 0) {
        const ex = top9.find(w => w.weapon === "Other");
        if (ex) ex.kills += rest;
        else top9.push({ weapon: "Other", kills: rest, color: "#6b7280" });
      }
      weaponData = top9.map(w => ({ ...w, pct: Math.round(w.kills / totalWK * 100) }));
    } catch (_) {}

    const rounds = parseInt(kpis.total_rounds) || 1;
    res.json({
      kpis: {
        totalMatches: parseInt(kpis.total_matches) || 0,
        mapsPlayed:   parseInt(kpis.maps_played)   || 0,
        totalKills:   parseInt(kpis.total_kills)   || 0,
        avgAdr: Math.round(parseInt(kpis.total_damage) / rounds * 10) / 10,
      },
      players: rawPlayers.map(p => ({
        steam_id: p.steam_id,
        name:     p.name,
        team:     p.team || "—",
        rating:   parseFloat(p.rating) || 0,
        kills:    parseInt(p.kills),
        deaths:   parseInt(p.deaths),
        assists:  parseInt(p.assists),
        kd:       Math.round(parseInt(p.kills) / Math.max(parseInt(p.deaths), 1) * 100) / 100,
        hs:       parseInt(p.kills) > 0 ? Math.round(parseInt(p.headshot_kills) / parseInt(p.kills) * 100) : 0,
        adr:      parseInt(p.rounds) > 0 ? Math.round(parseInt(p.damage) / parseInt(p.rounds) * 10) / 10 : 0,
        maps:     parseInt(p.maps),
        weapon:   (favWeapon[p.steam_id] || {}).weapon || "—",
      })),
      mapStats: mapStats.map(m => ({
        map:    m.map_name.replace("de_", "").replace(/^./, c => c.toUpperCase()),
        ctWins: parseInt(m.ct_wins),
        tWins:  parseInt(m.t_wins),
        played: parseInt(m.played),
      })),
      weaponData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
