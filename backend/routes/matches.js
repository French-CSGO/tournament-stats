const { Router } = require("express");
const db = require("../db");
const { calcRating } = require("../utils/rating");

const router = Router();

// GET /api/matches/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const [[match]] = await db.query(
    `SELECT m.id, m.start_time, m.end_time, m.team1_score, m.team2_score,
            m.team1_series_score, m.team2_series_score,
            m.cancelled, m.forfeit, m.max_maps, m.veto_mappool,
            t1.id AS team1_id, t1.name AS team1_name, t1.logo AS team1_logo,
            t2.id AS team2_id, t2.name AS team2_name, t2.logo AS team2_logo,
            w.id  AS winner_id,
            s.id  AS season_id, s.name AS season_name
     FROM \`match\` m
     LEFT JOIN team t1   ON t1.id = m.team1_id
     LEFT JOIN team t2   ON t2.id = m.team2_id
     LEFT JOIN team w    ON w.id  = m.winner
     LEFT JOIN season s  ON s.id  = m.season_id
     WHERE m.id = ?`,
    [id]
  );
  if (!match) return res.status(404).json({ error: "Match not found" });

  const [maps] = await db.query(
    `SELECT id, map_number, map_name,
            team1_score, team1_score_ct, team1_score_t,
            team2_score, team2_score_ct, team2_score_t,
            team1_first_side, start_time, end_time, demoFile
     FROM map_stats
     WHERE match_id = ?
     ORDER BY map_number ASC`,
    [id]
  );

  const [vetos] = await db.query(
    `SELECT v.id, v.team_name, v.map, v.pick_or_veto,
            vs.side, vs.team_name AS side_team
     FROM veto v
     LEFT JOIN veto_side vs ON vs.veto_id = v.id
     WHERE v.match_id = ?
     ORDER BY v.id ASC`,
    [id]
  );

  const mapIds = maps.map((m) => m.id);
  let playerStats = [];
  if (mapIds.length) {
    [playerStats] = await db.query(
      `SELECT ps.map_id, ps.steam_id, ps.name,
              ps.kills, ps.deaths, ps.assists, ps.headshot_kills,
              ps.damage, ps.roundsplayed,
              ps.k1, ps.k2, ps.k3, ps.k4, ps.k5,
              ps.v1, ps.v2, ps.v3, ps.v4, ps.v5,
              ps.firstkill_ct, ps.firstkill_t,
              ps.firstdeath_ct, ps.firstdeath_t,
              ps.bomb_plants, ps.bomb_defuses, ps.kast,
              t.id AS team_id, t.name AS team_name
       FROM player_stats ps
       LEFT JOIN team t ON t.id = ps.team_id
       WHERE ps.map_id IN (?)
       ORDER BY ps.kills DESC`,
      [mapIds]
    );
  }

  const mapsWithStats = maps.map((map) => ({
    ...map,
    players: playerStats
      .filter((p) => p.map_id === map.id)
      .map((p) => ({ ...p, rating: calcRating(p) }))
      .sort((a, b) => b.rating - a.rating),
  }));

  res.json({ match, maps: mapsWithStats, vetos });
});

module.exports = router;
