const { Router } = require("express");
const db = require("../db");
const { calcRating } = require("../utils/rating");

const router = Router();

// GET /api/seasons
router.get("/", async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.id, s.name, s.start_date, s.end_date,
            COUNT(DISTINCT m.id) AS match_count
     FROM season s
     LEFT JOIN \`match\` m ON m.season_id = s.id AND m.cancelled = 0
     GROUP BY s.id
     ORDER BY s.start_date DESC`
  );
  res.json(rows);
});

// GET /api/seasons/:id — matches + aggregated player stats
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const [[season]] = await db.query(
    `SELECT id, name, start_date, end_date FROM season WHERE id = ?`,
    [id]
  );
  if (!season) return res.status(404).json({ error: "Season not found" });

  const [matches] = await db.query(
    `SELECT m.id, m.start_time, m.end_time, m.team1_score, m.team2_score,
            m.team1_series_score, m.team2_series_score,
            m.cancelled, m.forfeit, m.max_maps,
            t1.id AS team1_id, t1.name AS team1_name, t1.logo AS team1_logo,
            t2.id AS team2_id, t2.name AS team2_name, t2.logo AS team2_logo,
            w.id  AS winner_id
     FROM \`match\` m
     LEFT JOIN team t1 ON t1.id = m.team1_id
     LEFT JOIN team t2 ON t2.id = m.team2_id
     LEFT JOIN team w  ON w.id  = m.winner
     WHERE m.season_id = ? AND m.cancelled = 0
     ORDER BY m.start_time DESC`,
    [id]
  );

  const [players] = await db.query(
    `SELECT ps.steam_id, ps.name,
            SUM(ps.kills)          AS kills,
            SUM(ps.deaths)         AS deaths,
            SUM(ps.assists)        AS assists,
            SUM(ps.headshot_kills) AS headshot_kills,
            SUM(ps.damage)         AS damage,
            SUM(ps.roundsplayed)   AS roundsplayed,
            SUM(ps.k1)             AS k1,
            SUM(ps.k2)             AS k2,
            SUM(ps.k3)             AS k3,
            SUM(ps.k4)             AS k4,
            SUM(ps.k5)             AS k5,
            SUM(ps.v1)             AS v1,
            SUM(ps.v2)             AS v2,
            SUM(ps.v3)             AS v3,
            SUM(ps.v4)             AS v4,
            SUM(ps.v5)             AS v5,
            SUM(ps.kast)           AS kast,
            COUNT(DISTINCT ps.match_id) AS maps_played
     FROM player_stats ps
     JOIN \`match\` m ON m.id = ps.match_id
     WHERE m.season_id = ? AND m.cancelled = 0
     GROUP BY ps.steam_id, ps.name
     ORDER BY kills DESC`,
    [id]
  );

  const playersWithRating = players
    .map((p) => ({ ...p, rating: calcRating(p) }))
    .sort((a, b) => b.rating - a.rating);

  res.json({ season, matches, players: playersWithRating });
});

module.exports = router;
