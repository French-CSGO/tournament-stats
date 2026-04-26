const { Router } = require("express");
const db = require("../db");
const { calcRating } = require("../utils/rating");

const router = Router();

// GET /api/teams
router.get("/", async (req, res) => {
  const [rows] = await db.query(
    `SELECT t.id, t.name, t.flag, t.logo, t.tag,
            COUNT(DISTINCT m.id) AS match_count
     FROM team t
     LEFT JOIN \`match\` m
       ON (m.team1_id = t.id OR m.team2_id = t.id) AND m.cancelled = 0
     GROUP BY t.id
     ORDER BY t.name ASC`
  );
  res.json(rows);
});

// GET /api/teams/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { season_id } = req.query;

  const [[team]] = await db.query(
    `SELECT id, name, flag, logo, tag FROM team WHERE id = ?`,
    [id]
  );
  if (!team) return res.status(404).json({ error: "Team not found" });

  let matchQuery = `
    SELECT m.id, m.start_time, m.end_time, m.team1_score, m.team2_score,
           m.team1_series_score, m.team2_series_score,
           m.cancelled, m.forfeit,
           t1.id AS team1_id, t1.name AS team1_name, t1.logo AS team1_logo,
           t2.id AS team2_id, t2.name AS team2_name, t2.logo AS team2_logo,
           w.id  AS winner_id,
           s.id  AS season_id, s.name AS season_name
    FROM \`match\` m
    LEFT JOIN team t1  ON t1.id = m.team1_id
    LEFT JOIN team t2  ON t2.id = m.team2_id
    LEFT JOIN team w   ON w.id  = m.winner
    LEFT JOIN season s ON s.id  = m.season_id
    WHERE (m.team1_id = ? OR m.team2_id = ?) AND m.cancelled = 0`;

  const params = [id, id];
  if (season_id) {
    matchQuery += ` AND m.season_id = ?`;
    params.push(season_id);
  }
  matchQuery += ` ORDER BY m.start_time DESC`;

  const [matches] = await db.query(matchQuery, params);

  const [players] = await db.query(
    `SELECT ps.steam_id, MAX(ps.name) AS name,
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
            SUM(ps.kast)           AS kast,
            COUNT(DISTINCT ps.map_id) AS maps_played
     FROM player_stats ps
     JOIN \`match\` m ON m.id = ps.match_id
     WHERE ps.team_id = ? AND m.cancelled = 0
     GROUP BY ps.steam_id
     ORDER BY kills DESC`,
    [id]
  );

  const playersWithRating = players
    .map((p) => ({ ...p, rating: calcRating(p) }))
    .sort((a, b) => b.rating - a.rating);

  res.json({ team, matches, players: playersWithRating });
});

module.exports = router;
